'use strict';
// Export CSV (séparateur « ; », compatible Excel français) d'un tableau HTML tel qu'il est affiché.
// Réutilise historyCsvCell (stock-history-csv.js) : guillemets échappés et protection contre les formules.

// Une cellule numérique affichée « 1 234 » (espaces fines) devient « 1234 » pour rester un nombre dans Excel.
function tableCsvValue(text) {
    const value = String(text ?? '').replace(/\s*\n\s*/g, ' ; ').replace(/[ \t]+/g, ' ').trim();
    const compact = value.replace(/[\s  ]/g, '');
    return /^-?\d+(,\d+)?$/.test(compact) && /\d[\s  ]\d/.test(value) ? compact : value;
}

function tableCsv(table) {
    const headers = [...table.querySelectorAll('thead th')];
    const skipped = new Set(headers.flatMap((th, index) => /^actions?$/i.test(th.textContent.trim()) ? [index] : []));
    const keep = (_, index) => !skipped.has(index);
    const text = cell => cell.innerText ?? cell.textContent;
    const lines = [headers.filter(keep).map(th => tableCsvValue(text(th)))];
    for (const row of table.querySelectorAll('tbody tr')) {
        if (row.hidden || row.classList.contains('hidden')) continue;
        const cells = [...row.cells];
        // Ligne de message (« Aucun résultat… ») fusionnée sur toutes les colonnes.
        if (cells.length === 1 && cells[0].colSpan > 1) continue;
        lines.push(cells.filter(keep).map(cell => tableCsvValue(text(cell))));
    }
    return '﻿' + lines.map(row => row.map(historyCsvCell).join(';')).join('\r\n');
}

function tableCsvFileName(name, site) {
    const date = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date());
    const slug = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    return ['qbox', slug(name), slug(site), date].filter(Boolean).join('-') + '.csv';
}

function downloadTableCsv(table, fileName) {
    const url = URL.createObjectURL(new Blob([tableCsv(table)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if (typeof module !== 'undefined') module.exports = { tableCsvValue, tableCsv, tableCsvFileName };
