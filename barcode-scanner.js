'use strict';
// Lecture de codes-barres par la caméra (réceptions et inventaires).
// - parseBarcode : décode un GS1 DataMatrix / GS1-128 (GTIN, lot, péremption) ou un EAN/UPC simple.
// - QBoxScanner.open : fenêtre caméra ; la bibliothèque ZXing (zxing.min.js, hébergée avec le site)
//   n'est chargée qu'à la première ouverture.

const GS = '\u001d';

function gtin14(digits) {
    return /^\d{8}$|^\d{12,14}$/.test(digits) ? digits.padStart(14, '0') : null;
}

// AAMMJJ → AAAA-MM-JJ ; JJ = 00 signifie « fin du mois » (règle GS1).
function gs1Date(value) {
    if (!/^\d{6}$/.test(value)) return null;
    const year = 2000 + Number(value.slice(0, 2)), month = Number(value.slice(2, 4));
    let day = Number(value.slice(4, 6));
    if (month < 1 || month > 12) return null;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (day === 0) day = lastDay;
    if (day > lastDay) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Identifiants d'application GS1 utiles ici : longueur fixe ou variable (terminée par GS).
const GS1_FIXED = { '00': 18, '01': 14, '02': 14, '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6 };
const GS1_VARIABLE = ['10', '21', '22', '240', '241', '30', '37', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];

function parseGs1(raw) {
    let text = raw.replace(/^\]d2|^\]C1|^\]Q3|^\]e0/, '');
    const fields = {};
    // Forme lisible : (01)03453120000011(17)270331(10)ABC123
    if (text.startsWith('(')) {
        const re = /\((\d{2,4})\)([^(]*)/g;
        let match;
        while ((match = re.exec(text))) fields[match[1]] = match[2].trim();
    } else {
        text = text.replace(/^\u001d+/, '');
        while (text) {
            const ai = Object.keys(GS1_FIXED).find(code => text.startsWith(code)) ||
                GS1_VARIABLE.find(code => text.startsWith(code));
            if (!ai) break; // identifiant inconnu : on garde les champs déjà lus
            text = text.slice(ai.length);
            if (GS1_FIXED[ai]) {
                fields[ai] = text.slice(0, GS1_FIXED[ai]);
                text = text.slice(GS1_FIXED[ai]).replace(/^\u001d/, '');
            } else {
                const end = text.indexOf(GS);
                fields[ai] = end < 0 ? text : text.slice(0, end);
                text = end < 0 ? '' : text.slice(end + 1);
            }
        }
    }
    if (!fields['01'] || !/^\d{14}$/.test(fields['01'])) return null;
    return {
        gtin: fields['01'],
        lot: fields['10'] ? fields['10'].slice(0, 120) : null,
        expiry: fields['17'] ? gs1Date(fields['17']) : null,
        serial: fields['21'] || null
    };
}

function parseBarcode(raw) {
    const text = String(raw ?? '').trim();
    if (!text) return null;
    const gs1 = (text.includes(GS) || /^\(\d{2}\)|^\]d2|^\]C1|^01\d{14}/.test(text)) ? parseGs1(text) : null;
    if (gs1) return { ...gs1, raw: text, kind: 'gs1' };
    const digits = gtin14(text);
    if (digits) return { gtin: digits, lot: null, expiry: null, serial: null, raw: text, kind: 'gtin' };
    return { gtin: null, lot: null, expiry: null, serial: null, raw: text, kind: 'text' };
}

const QBoxScanner = (() => {
    let libraryLoading = null;
    let session = null;

    function loadLibrary() {
        if (typeof ZXing !== 'undefined') return Promise.resolve();
        libraryLoading ||= new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'zxing.min.js';
            script.onload = () => resolve();
            script.onerror = () => { libraryLoading = null; reject(new Error('Bibliothèque de lecture indisponible.')); };
            document.head.append(script);
        });
        return libraryLoading;
    }

    function close() {
        if (!session) return;
        try { session.controls?.stop(); } catch { /* déjà arrêté */ }
        try { session.reader?.reset(); } catch { /* déjà arrêté */ }
        session.dialog.remove();
        session = null;
    }

    // onResult(parsed) est appelé une fois ; la fenêtre se ferme ensuite.
    async function open({ title = 'Scanner un code', onResult }) {
        close();
        const dialog = document.createElement('div');
        dialog.className = 'qbox-scanner fixed inset-0 z-[120] bg-slate-950/80 flex items-center justify-center p-4';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', title);
        const box = document.createElement('div');
        box.className = 'bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl';
        const head = document.createElement('div');
        head.className = 'p-4 flex items-center justify-between gap-2 border-b border-slate-100';
        const heading = document.createElement('h3');
        heading.className = 'font-bold text-sm text-slate-900';
        heading.textContent = title;
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold';
        cancel.textContent = 'Fermer';
        head.append(heading, cancel);
        const video = document.createElement('video');
        video.className = 'w-full aspect-[4/3] bg-black object-cover';
        video.muted = true;
        video.setAttribute('playsinline', '');
        const status = document.createElement('p');
        status.className = 'p-3 text-xs text-slate-600';
        status.setAttribute('role', 'status');
        status.textContent = 'Ouverture de la caméra…';
        box.append(head, video, status);
        dialog.append(box);
        document.body.append(dialog);
        session = { dialog };
        const current = session;
        cancel.addEventListener('click', close);
        dialog.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
        cancel.focus();

        if (!navigator.mediaDevices?.getUserMedia) {
            status.textContent = 'Caméra indisponible sur cet appareil ou ce navigateur.';
            return;
        }
        try {
            await loadLibrary();
            if (session !== current) return;
            const hints = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [
                ZXing.BarcodeFormat.DATA_MATRIX, ZXing.BarcodeFormat.QR_CODE, ZXing.BarcodeFormat.CODE_128,
                ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A]], [ZXing.DecodeHintType.TRY_HARDER, true]]);
            const reader = new ZXing.BrowserMultiFormatReader(hints, 300);
            current.reader = reader;
            status.textContent = 'Placez le code-barres dans le cadre.';
            await reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } } }, video, (result) => {
                if (!result || session !== current) return;
                const parsed = parseBarcode(result.getText());
                close();
                onResult(parsed);
            });
        } catch (error) {
            if (session !== current) return;
            status.textContent = error?.name === 'NotAllowedError'
                ? 'Accès à la caméra refusé : autorisez-le dans les réglages du navigateur.'
                : error?.name === 'NotFoundError' ? 'Aucune caméra détectée.' : `Lecture impossible : ${error.message}`;
        }
    }

    return Object.freeze({ open, close });
})();

if (typeof module !== 'undefined') module.exports = { parseBarcode, gs1Date };
