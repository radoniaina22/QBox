'use strict';

function historyCsvCell(value) {
    let text = String(value ?? '');
    if (/^[\s\x00-\x1f]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

function historyCsv(rows, context) {
    const columns = ['Port', 'Filtres appliqués', 'Couverture', 'Date Madagascar', 'Intrant', 'Opération', 'Référence', 'Utilisateur',
        'Stock avant', 'Stock après', 'Réservé avant', 'Réservé après', 'Disponible après'];
    const lines = rows.map(entry => [
        context.port, context.filter, context.coverage,
        new Date(entry.occurred_at).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' }),
        entry.product_name, entry.operation, entry.reference, entry.performed_by_name || 'Nom non renseigné',
        entry.before_stock, entry.after_stock, entry.before_reserved, entry.after_reserved,
        (BigInt(entry.after_stock) - BigInt(entry.after_reserved)).toString()
    ]);
    return '\ufeff' + [columns, ...lines].map(row => row.map(historyCsvCell).join(';')).join('\r\n');
}
