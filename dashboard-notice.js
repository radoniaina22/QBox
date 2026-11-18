'use strict';
/*
 * Q.box — État du tableau de bord (affichage uniquement).
 * Script purement visuel : il lit le texte que l'application écrit dans
 * #postgres-dashboard-status, puis :
 *  - ajoute "qb-notice-error" à l'encart quand ce texte signale une erreur
 *    (le CSS n'affiche l'encart que dans ce cas) ;
 *  - recopie l'heure de mise à jour dans le bandeau « Vue d'ensemble » ;
 *  - ajoute "qb-loading" au tableau de bord pendant le chargement.
 * Aucune donnée, fonction métier ni appel serveur.
 */
(() => {
    const ERROR_PATTERN = /indisponible|impossible|erreur|échec/i;
    const LOADING_PATTERN = /^Chargement du tableau de bord/i;
    const UPDATED_PATTERN = /Actualisé le\s+\d{1,2}\/\d{1,2}\/\d{4}\s+(\d{1,2}:\d{2})/i;
    const notice = document.getElementById('postgres-dashboard-notice');
    const view = document.getElementById('view-dashboard');
    const updated = document.getElementById('qb-dashboard-updated');
    if (!notice || !window.MutationObserver) return;

    const refresh = () => {
        const status = document.getElementById('postgres-dashboard-status');
        const text = status ? status.textContent.trim() : '';
        notice.classList.toggle('qb-notice-error', ERROR_PATTERN.test(text));
        if (view) view.classList.toggle('qb-loading', LOADING_PATTERN.test(text));
        const match = text.match(UPDATED_PATTERN);
        if (updated && match) updated.textContent = `Actualisé à ${match[1]}`;
    };

    // L'application réécrit className au démarrage : on réapplique après chaque changement.
    new MutationObserver(refresh).observe(notice, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class']
    });
    refresh();
})();
