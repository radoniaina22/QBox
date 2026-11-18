'use strict';
/*
 * Q.box — Menu repliable sur téléphone et tablette.
 * Script purement visuel : il ajoute un bouton « Menu » dans l'en-tête et
 * un voile derrière la barre latérale, puis bascule la classe "qb-nav-open"
 * sur <html>. Le CSS (modern-theme.css) n'utilise ce mécanisme que sous 900 px.
 * Aucune donnée, fonction métier ni appel serveur.
 */
(() => {
    const root = document.documentElement;
    const NARROW = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;

    function mount() {
        const app = document.getElementById('main-app');
        const aside = app && app.querySelector(':scope > aside');
        const header = app && app.querySelector(':scope > main > header');
        if (!aside || !header || document.getElementById('qb-menu-toggle')) return;

        if (!aside.id) aside.id = 'qb-sidebar';
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'qb-menu-toggle';
        button.className = 'qb-menu-toggle no-print';
        button.setAttribute('aria-controls', aside.id);
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Ouvrir le menu');
        const icon = document.createElement('i');
        icon.className = 'ph ph-list';
        icon.setAttribute('aria-hidden', 'true');
        button.appendChild(icon);
        header.insertBefore(button, header.firstChild);

        const scrim = document.createElement('div');
        scrim.className = 'qb-nav-scrim no-print';
        scrim.setAttribute('aria-hidden', 'true');
        app.appendChild(scrim);

        const setOpen = open => {
            root.classList.toggle('qb-nav-open', open);
            button.setAttribute('aria-expanded', String(open));
            button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
            icon.className = open ? 'ph ph-x' : 'ph ph-list';
        };
        button.addEventListener('click', () => setOpen(!root.classList.contains('qb-nav-open')));
        scrim.addEventListener('click', () => setOpen(false));
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && root.classList.contains('qb-nav-open')) { setOpen(false); button.focus(); }
        });
        // Après le choix d'une rubrique, le menu se referme (écrans étroits uniquement).
        aside.addEventListener('click', event => {
            if (NARROW && NARROW.matches && event.target.closest('.nav-item')) setOpen(false);
        });
        if (NARROW) {
            const reset = event => { if (!event.matches) setOpen(false); };
            if (NARROW.addEventListener) NARROW.addEventListener('change', reset);
            else if (NARROW.addListener) NARROW.addListener(reset);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
