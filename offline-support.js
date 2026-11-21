'use strict';
// Enregistre le service worker (sw.js) et signale la perte de connexion.
(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(error => console.warn('Mode hors connexion indisponible :', error.message));
        });
    }

    let banner = null;
    function update() {
        if (navigator.onLine) {
            banner?.remove();
            banner = null;
            return;
        }
        if (banner) return;
        banner = document.createElement('div');
        banner.id = 'qbox-offline-banner';
        banner.setAttribute('role', 'status');
        banner.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-[calc(100%-2rem)] px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2';
        const icon = document.createElement('i');
        icon.className = 'ph ph-wifi-slash text-amber-400 text-base shrink-0';
        icon.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.textContent = 'Hors connexion : les données affichées peuvent être anciennes et aucun enregistrement n’est possible. Actualisez les données au retour du réseau.';
        banner.append(icon, text);
        document.body.append(banner);
    }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update); else update();
})();
