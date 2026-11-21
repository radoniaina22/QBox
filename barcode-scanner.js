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

// Lecture en continu gérée ici (et non par la boucle de ZXing, qui s'arrête sans prévenir à la
// moindre erreur imprévue) : lecteur natif du navigateur (BarcodeDetector) s'il existe, sinon ZXing.
// Le détecteur DataMatrix de ZXing ne trouve un code que si le centre de l'image tombe dessus
// (à ±0,4 fois sa taille près) : on analyse donc une grille de fenêtres autour du centre.
const NATIVE_FORMATS = ['data_matrix', 'qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a'];
const SCAN_INTERVAL_MS = 60;
const SCAN_BUDGET_MS = 90;
const MAX_SCAN_SIDE = 1280;
const CROP_SIDE = 0.5;   // fenêtre DataMatrix : moitié du petit côté de l'image
const CROP_MAX_PX = 640;
const CROP_STEP = 0.08;  // pas de la grille (fraction du petit côté), 5 × 5 positions

// Positions de la grille, du centre vers l'extérieur.
const CROP_OFFSETS = (() => {
    const list = [];
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) list.push([x * CROP_STEP, y * CROP_STEP]);
    return list.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
})();

async function nativeDetector() {
    if (typeof BarcodeDetector === 'undefined') return null;
    try {
        const supported = await BarcodeDetector.getSupportedFormats();
        const formats = NATIVE_FORMATS.filter(format => supported.includes(format));
        return formats.includes('data_matrix') ? new BarcodeDetector({ formats }) : null;
    } catch { return null; }
}

function zxingDecoder() {
    const F = ZXing.BarcodeFormat;
    const readerFor = formats => {
        const reader = new ZXing.MultiFormatReader();
        reader.setHints(new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, formats]]));
        return reader;
    };
    // TRY_HARDER est volontairement absent : sans code visible, il fait passer l'analyse d'une image
    // de ~20 ms à ~500 ms (bien plus sur téléphone), ce qui bloquait toute la lecture.
    const linear = readerFor([F.QR_CODE, F.CODE_128, F.EAN_13, F.EAN_8, F.UPC_A]);
    const dataMatrix = readerFor([F.DATA_MATRIX]);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
    let step = 0;

    function attempt(reader, video, sx, sy, sw, sh, maxSide) {
        const scale = Math.min(1, maxSide / Math.max(sw, sh));
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(canvas)));
        try {
            return reader.decodeWithState(bitmap).getText();
        } catch (error) {
            if (error instanceof ZXing.NotFoundException || error instanceof ZXing.ChecksumException ||
                error instanceof ZXing.FormatException) return null;
            throw error;
        } finally {
            reader.reset();
        }
    }

    // Tâches parcourues en boucle : toutes les 5 fenêtres DataMatrix, codes linéaires et QR sur l'image
    // entière réduite ou (en alternance) sur le centre en résolution réelle (petits codes éloignés).
    const tasks = CROP_OFFSETS.flatMap((offset, i) => (i % 5 === 0 ? [i % 10 ? 'center' : 'whole', offset] : [offset]));
    return video => {
        const width = video.videoWidth, height = video.videoHeight, short = Math.min(width, height);
        const task = tasks[step++ % tasks.length];
        if (task === 'whole') return attempt(linear, video, 0, 0, width, height, MAX_SCAN_SIDE);
        if (task === 'center') {
            const cw = Math.min(width, MAX_SCAN_SIDE), ch = Math.min(height, Math.round(MAX_SCAN_SIDE * 0.6));
            return attempt(linear, video, Math.round((width - cw) / 2), Math.round((height - ch) / 2), cw, ch, MAX_SCAN_SIDE);
        }
        const [dx, dy] = task;
        const side = Math.round(short * CROP_SIDE);
        const sx = Math.max(0, Math.min(width - side, Math.round(width / 2 + dx * short - side / 2)));
        const sy = Math.max(0, Math.min(height - side, Math.round(height / 2 + dy * short - side / 2)));
        return attempt(dataMatrix, video, sx, sy, side, side, CROP_MAX_PX);
    };
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
        clearTimeout(session.timer);
        session.stream?.getTracks().forEach(track => { try { track.stop(); } catch { /* déjà arrêté */ } });
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
        video.style.display = 'block';
        // Cadre de visée (zone où la lecture est la plus fiable), styles posés en JS (pas de classe Tailwind à générer).
        const viewport = document.createElement('div');
        viewport.style.position = 'relative';
        const aim = document.createElement('div');
        aim.setAttribute('aria-hidden', 'true');
        Object.assign(aim.style, {
            position: 'absolute', left: '50%', top: '50%', width: '35%', aspectRatio: '1 / 1',
            transform: 'translate(-50%, -50%)', border: '3px solid rgba(255, 255, 255, 0.9)', borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)', pointerEvents: 'none'
        });
        viewport.style.overflow = 'hidden';
        viewport.append(video, aim);
        const status = document.createElement('p');
        status.className = 'p-3 text-xs text-slate-600';
        status.setAttribute('role', 'status');
        status.textContent = 'Ouverture de la caméra…';
        box.append(head, viewport, status);
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
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            if (session !== current) { stream.getTracks().forEach(track => track.stop()); return; }
            current.stream = stream;
            const track = stream.getVideoTracks()[0];
            // Mise au point continue si l'appareil le permet (sinon les petits codes restent flous).
            try {
                if (track?.getCapabilities?.().focusMode?.includes('continuous')) {
                    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
                }
            } catch { /* réglage facultatif */ }
            video.srcObject = stream;
            await video.play().catch(() => {});

            let detect;
            const detector = await nativeDetector();
            if (detector) {
                detect = async () => (await detector.detect(video))[0]?.rawValue || null;
            } else {
                status.textContent = 'Chargement du lecteur…';
                await loadLibrary();
                const decode = zxingDecoder();
                // Plusieurs fenêtres par passage, dans un temps limité pour garder l'affichage fluide.
                detect = async () => {
                    const until = performance.now() + SCAN_BUDGET_MS;
                    do {
                        const text = decode(video);
                        if (text) return text;
                    } while (performance.now() < until);
                    return null;
                };
            }
            if (session !== current) return;
            status.textContent = 'Placez le code dans le carré blanc et approchez jusqu’à ce qu’il en remplisse une bonne partie, net et bien éclairé.';

            let errors = 0;
            const scan = async () => {
                if (session !== current) return;
                let text = null;
                if (video.readyState >= 2 && video.videoWidth > 0) {
                    try {
                        text = await detect();
                        errors = 0;
                    } catch (error) {
                        errors += 1;
                        if (errors === 1) console.warn('Lecture du code-barres :', error);
                        if (errors >= 20) status.textContent = `Lecture difficile : ${error?.message || error}`;
                    }
                }
                if (session !== current) return;
                if (text) {
                    const parsed = parseBarcode(text);
                    close();
                    onResult(parsed);
                    return;
                }
                current.timer = setTimeout(scan, SCAN_INTERVAL_MS);
            };
            scan();
        } catch (error) {
            if (session !== current) return;
            status.textContent = error?.name === 'NotAllowedError'
                ? 'Accès à la caméra refusé : autorisez-le dans les réglages du navigateur.'
                : error?.name === 'NotFoundError' ? 'Aucune caméra détectée.'
                : error?.name === 'NotReadableError' ? 'Caméra déjà utilisée par une autre application : fermez-la puis réessayez.'
                : `Lecture impossible : ${error?.message || error}`;
        }
    }

    return Object.freeze({ open, close });
})();

if (typeof module !== 'undefined') module.exports = { parseBarcode, gs1Date };
