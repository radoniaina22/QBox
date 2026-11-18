'use strict';
/*
 * Q.box — Bascule mode clair / mode sombre.
 * Script purement visuel : il ajoute ou retire la classe "qb-dark" sur <html>
 * et mémorise le choix dans le navigateur (localStorage). Il n'interagit avec
 * aucune donnée, aucune fonction métier ni aucun appel au serveur.
 */
(() => {
    const STORAGE_KEY = 'qbox-theme';
    const root = document.documentElement;
    const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    const readChoice = () => {
        try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; }
    };
    const saveChoice = value => {
        try { localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* stockage indisponible : choix limité à la session */ }
    };
    const isDark = () => root.classList.contains('qb-dark');
    const FRAME_CSS = 'admin-dark.css';

    // Cadres intégrés du même site (ex. admin-local.html?embedded=1) :
    // on y ajoute la feuille sombre et la même classe, sans toucher à leur contenu.
    function themeFrame(frame) {
        try {
            const doc = frame.contentDocument;
            if (!doc || !doc.documentElement || !doc.head) return;
            if (!doc.getElementById('qb-frame-dark')) {
                const link = doc.createElement('link');
                link.id = 'qb-frame-dark';
                link.rel = 'stylesheet';
                link.href = new URL(FRAME_CSS, window.location.href).href;
                doc.head.appendChild(link);
            }
            doc.documentElement.classList.toggle('qb-dark', isDark());
        } catch (error) { /* cadre d'un autre site : ignoré */ }
    }
    const themeFrames = () => document.querySelectorAll('iframe').forEach(themeFrame);
    document.addEventListener('load', event => {
        if (event.target && event.target.tagName === 'IFRAME') themeFrame(event.target);
    }, true);

    function refreshButton() {
        const button = document.getElementById('qb-theme-toggle');
        if (!button) return;
        const dark = isDark();
        const label = dark ? 'Activer le mode clair' : 'Activer le mode sombre';
        button.setAttribute('aria-pressed', String(dark));
        button.setAttribute('aria-label', label);
        button.title = label;
        button.querySelector('i').className = dark ? 'ph ph-sun' : 'ph ph-moon-stars';
    }

    function apply(dark) {
        root.classList.toggle('qb-dark', dark);
        refreshButton();
        themeFrames();
    }

    // Application immédiate (avant l'affichage) pour éviter un flash clair.
    const stored = readChoice();
    apply(stored ? stored === 'dark' : Boolean(systemDark && systemDark.matches));

    // Si l'utilisateur n'a rien choisi, on suit le réglage du système.
    if (systemDark) {
        const follow = event => { if (!readChoice()) apply(event.matches); };
        if (systemDark.addEventListener) systemDark.addEventListener('change', follow);
        else if (systemDark.addListener) systemDark.addListener(follow);
    }

    // Synchronisation entre onglets / fenêtres intégrées du même site.
    window.addEventListener('storage', event => {
        if (event.key === STORAGE_KEY && event.newValue) apply(event.newValue === 'dark');
    });

    function mount() {
        if (document.getElementById('qb-theme-toggle')) return;
        const header = document.querySelector('#main-app > main > header');
        if (!header) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'qb-theme-toggle';
        button.className = 'qb-theme-toggle no-print';
        button.appendChild(document.createElement('i'));
        button.addEventListener('click', () => {
            const dark = !isDark();
            root.classList.add('qb-theme-switching');
            apply(dark);
            saveChoice(dark ? 'dark' : 'light');
            window.setTimeout(() => root.classList.remove('qb-theme-switching'), 350);
        });
        header.appendChild(button);
        refreshButton();
        themeFrames();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
