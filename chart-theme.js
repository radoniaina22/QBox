'use strict';
/*
 * Q.box — Couleurs des graphiques Chart.js selon le thème « Horizon ».
 * Script purement visuel : il ne lit ni ne modifie aucune donnée.
 * Les graphiques sont créés par le code de l'application avec des couleurs
 * fixes ; ce module traduit ces couleurs, au moment du dessin, vers la palette
 * du thème (clair ou sombre). Le sens des couleurs est conservé :
 * rouge = sous le seuil, ambre = à surveiller, vert = au-delà, gris = inconnu.
 */
(() => {
    if (typeof window.Chart !== 'function') return;
    const root = document.documentElement;
    const isDark = () => root.classList.contains('qb-dark');

    // Couleur d'origine (en minuscules) -> [mode clair, mode sombre]
    const PALETTE = {
        // Niveaux de stock
        '#e11d48': ['#e11d48', '#fb7185'],
        '#b91c1c': ['#e11d48', '#fb7185'],
        '#d97706': ['#f59e0b', '#fbbf24'],
        '#b45309': ['#f59e0b', '#fbbf24'],
        '#059669': ['#10b981', '#34d399'],
        '#15803d': ['#10b981', '#34d399'],
        // Séries des courbes
        '#0284c7': ['#1d58c9', '#6aa0f8'],
        '#be185d': ['#db2777', '#f472b6'],
        '#7c3aed': ['#7c3aed', '#a78bfa'],
        '#0f766e': ['#0e9384', '#2dd4bf'],
        // Textes, axes, grilles, infobulles
        '#64748b': ['#5f6f88', '#8fa0b9'],
        '#475569': ['#4a5a73', '#a9b6c9'],
        '#334155': ['#33425a', '#c3cfe0'],
        '#e2e8f0': ['#e6ecf4', 'rgba(148, 170, 205, .16)'],
        '#0f172a': ['#0f1b2d', '#1b2740'],
        '#e2e8f0ff': ['#e6ecf4', 'rgba(148, 170, 205, .16)']
    };
    // Couleurs par défaut de Chart.js (textes et grilles non précisés)
    const DEFAULTS = {
        '#666': ['#5f6f88', '#8fa0b9'],
        'rgba(0,0,0,0.1)': ['#e6ecf4', 'rgba(148, 170, 205, .16)'],
        'rgba(0, 0, 0, 0.1)': ['#e6ecf4', 'rgba(148, 170, 205, .16)']
    };

    const translate = value => {
        if (typeof value !== 'string') return value;
        const key = value.trim().toLowerCase();
        const pair = PALETTE[key] || DEFAULTS[key];
        return pair ? pair[isDark() ? 1 : 0] : value;
    };

    // Intercepte fillStyle / strokeStyle sur le contexte de dessin du graphique.
    function patchContext(ctx) {
        if (!ctx || ctx.__qbThemed) return;
        const proto = Object.getPrototypeOf(ctx);
        for (const prop of ['fillStyle', 'strokeStyle']) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, prop) ||
                Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, prop);
            if (!descriptor || !descriptor.set) continue;
            Object.defineProperty(ctx, prop, {
                configurable: true,
                get() { return descriptor.get.call(this); },
                set(value) { descriptor.set.call(this, translate(value)); }
            });
        }
        Object.defineProperty(ctx, '__qbThemed', { value: true });
    }

    window.Chart.register({
        id: 'qbHorizonTheme',
        beforeInit(chart) { patchContext(chart.ctx); },
        beforeDraw(chart) { patchContext(chart.ctx); }
    });

    // Police des graphiques alignée sur l'interface
    if (window.Chart.defaults && window.Chart.defaults.font) {
        window.Chart.defaults.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif";
    }

    // Redessine les graphiques visibles quand on bascule clair / sombre.
    const redraw = () => {
        const instances = window.Chart.instances ? Object.values(window.Chart.instances) : [];
        for (const chart of instances) {
            try { chart.draw(); } catch (error) { /* graphique détruit entre-temps */ }
        }
    };
    let lastDark = isDark();
    new MutationObserver(() => {
        if (isDark() !== lastDark) { lastDark = isDark(); redraw(); }
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
})();
