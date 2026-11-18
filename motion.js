'use strict';
/*
 * Q.box — Petites animations déclenchées par les mises à jour d'affichage.
 * Script purement visuel : quand l'application change le texte d'un
 * indicateur du tableau de bord ou d'un compteur de la barre latérale,
 * on ajoute brièvement la classe "qb-value-pop" (animation définie dans
 * motion.css). Le texte lui-même n'est jamais modifié.
 * Aucune donnée, fonction métier ni appel serveur.
 */
(() => {
    if (!window.MutationObserver) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    const pop = element => {
        if (reduced && reduced.matches) return;
        element.classList.remove('qb-value-pop');
        void element.offsetWidth; // relance l'animation
        element.classList.add('qb-value-pop');
    };

    function watch(element) {
        let last = element.textContent;
        new MutationObserver(() => {
            const current = element.textContent;
            if (current !== last) { last = current; pop(element); }
        }).observe(element, { childList: true, characterData: true, subtree: true });
        element.addEventListener('animationend', event => {
            if (event.animationName === 'qb-pop') element.classList.remove('qb-value-pop');
        });
    }

    function mount() {
        document.querySelectorAll('.dashboard-kpi-value, #main-app .nav-item > span[id^="badge-"]').forEach(watch);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
})();
