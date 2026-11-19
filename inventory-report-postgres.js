'use strict';

function groupInventoryItems(items) {
    const groups = new Map();
    for (const item of items) {
        const group = groups.get(item.product_name) || { name: item.product_name, expected: 0n, counted: 0n, difference: 0n };
        group.expected += BigInt(item.system_quantity) - BigInt(item.in_delivery);
        group.counted += BigInt(item.counted);
        group.difference += BigInt(item.difference);
        groups.set(item.product_name, group);
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function inventoryReportTable(items) {
    const table = document.createElement('table');
    table.className = 'inventory-report-table';
    const head = document.createElement('thead');
    const header = document.createElement('tr');
    for (const label of ['Intrant', 'Attendu', 'Compté', 'Écart']) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = label;
        header.append(th);
    }
    head.append(header);
    const body = document.createElement('tbody');
    for (const item of groupInventoryItems(items)) {
        const row = document.createElement('tr');
        for (const value of [item.name, item.expected, item.counted, item.difference]) {
            const cell = document.createElement('td');
            cell.textContent = typeof value === 'bigint' ? value.toLocaleString('fr-FR') : value;
            row.append(cell);
        }
        body.append(row);
    }
    table.append(head, body);
    return table;
}

function inventoryReportText(tag, text, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

// En-tête d'impression : logo UNFPA, identité Q.box, type de document, magasin, date de l'inventaire et date d'édition.
function inventoryReportHeader(inventory, portName, portRegion = '') {
    const header = inventoryReportText('div', '', 'inventory-report-header');
    const identity = inventoryReportText('div', '', 'inventory-report-identity');
    const logo = document.createElement('img');
    logo.src = 'logo-unfpa.svg';
    logo.alt = 'Logo UNFPA';
    logo.className = 'inventory-report-logo';
    // Dimensions explicites : le logo reste à sa taille même si la feuille de style n'est pas chargée.
    logo.width = 110;
    logo.height = 48;
    const organization = inventoryReportText('div', '', 'inventory-report-organization');
    organization.append(inventoryReportText('strong', 'UNFPA Madagascar'), inventoryReportText('span', 'Q.box · Logistique santé par drone'));
    identity.append(logo, organization);
    const meta = inventoryReportText('div', '', 'inventory-report-header-meta');
    const local = value => new Date(value).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' });
    meta.append(inventoryReportText('strong', 'INVENTAIRE PHYSIQUE'),
        inventoryReportText('span', portRegion ? `${portName} · ${portRegion}` : portName),
        inventoryReportText('span', `Inventaire du ${local(inventory.created_at)}`),
        inventoryReportText('span', `Édité le ${local(new Date())} (Madagascar)`));
    header.append(identity, meta);
    return header;
}

function renderInventoryReport(inventory, portName, report = $('inventory-print-report'), portRegion = '') {
    report.replaceChildren();
    report.append(inventoryReportHeader(inventory, portName, portRegion));
    const title = document.createElement('h1');
    title.textContent = 'Rapport d’inventaire physique';
    const details = document.createElement('p');
    details.textContent = `${portName} · ${new Date(inventory.created_at).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (heure de Madagascar) · Utilisateur : ${inventory.created_by_name || 'Nom non renseigné'} · Identifiant : ${inventory.id}`;
    const note = document.createElement('p');
    note.textContent = 'Quantités regroupées par intrant. Attendu = stock système moins quantités en vol. Le comptage exclut les produits en vol et en quarantaine.';
    report.append(title, details, note, inventoryReportTable(inventory.items));
    if (inventory.observations) {
        const observations = document.createElement('p');
        observations.style.whiteSpace = 'pre-wrap';
        observations.textContent = `Remarques et observations : ${inventory.observations}`;
        report.append(observations);
    }
    return report;
}
