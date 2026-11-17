'use strict';

async function enrichHistoryActors(path, result, resolveNames) {
    let rows;
    if (path.endsWith('/qbox_stock_history') || path.endsWith('/qbox_planning_history')) rows = result;
    else if (path.endsWith('/qbox_list_inventories')) rows = result;
    else if (path.endsWith('/qbox_list_quarantines')) rows = result.flatMap(item => item.actions || []);
    else if (path.endsWith('/qbox_flight_details') || path.endsWith('/qbox_shipment_details')) rows = result.changes || [];
    else return result;
    const ids = [...new Set(rows.flatMap(row => [row.performed_by, row.created_by]).filter(Boolean))];
    if (!ids.length) return result;
    const names = await resolveNames(ids);
    if (!Array.isArray(names)) throw new Error('Réponse invalide pour les noms des utilisateurs.');
    const byId = new Map(names.map(row => [row.user_id, row.display_name]));
    for (const row of rows) {
        if ('performed_by' in row) row.performed_by_name = byId.get(row.performed_by) || 'Nom non renseigné';
        if ('created_by' in row) row.created_by_name = byId.get(row.created_by) || 'Nom non renseigné';
    }
    return result;
}

function renderPlanningHistoryEntries(container, changes) {
    container.replaceChildren();
    if (!changes.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Aucune modification enregistrée. Les modifications antérieures à cette fonctionnalité ne sont pas disponibles.';
        container.append(empty);
        return;
    }
    for (const change of changes) {
        const entry = document.createElement('section');
        entry.className = 'planning-history-entry';
        const heading = document.createElement('strong');
        heading.textContent = `Version ${change.version} · ${new Date(change.performed_at).toLocaleString('fr-FR', {timeZone:'Indian/Antananarivo'})} (Madagascar) · ${change.performed_by_name || 'Nom non renseigné'}`;
        entry.append(heading);
        for (const [label, snapshot] of [['Avant', change.before_snapshot], ['Après', change.after_snapshot]]) {
            const details = document.createElement('p');
            const items = snapshot.items.map(item => `${item.csb_name} · ${item.product_name} : ${item.quantity}`).join(' ; ') || 'Aucune ligne';
            details.textContent = `${label} : ${snapshot.start_date} au ${snapshot.end_date} · ${items}`;
            entry.append(details);
        }
        const observations = document.createElement('p');
        observations.textContent = `Remarques et observations : ${change.observations || 'Aucune'}`;
        observations.className = 'planning-history-observations';
        entry.append(observations);
        container.append(entry);
    }
}

function deliveryArticleRows(items, stocks, legacy = false) {
    const articles = new Map();
    const rows = items.map(item => {
        const name = legacy ? item.name : item.product_name;
        const key = legacy ? (item.product_id || item.productId || name) : item.product_id;
        if (!key) throw new Error('Référentiel d’intrant manquant dans le bon de livraison.');
        if (!articles.has(key)) articles.set(key, articles.size + 1);
        const matches = legacy
            ? stocks.filter(stock => stock.name === name && stock.lot === item.lot)
            : stocks.filter(stock => stock.id === item.stock_id);
        const expiry = matches.length === 1 ? (legacy ? matches[0].exp_date : matches[0].expiry_date) : null;
        return {article:articles.get(key), name, lot:item.lot || 'Non renseigné',
            expiry:expiry || 'Non renseignée', quantity:legacy ? item.qty : item.quantity};
    });
    return {rows, count:articles.size};
}

function dashboardReportTable(headers, rows) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dashboard-report-scroll';
    const table = document.createElement('table');
    table.className = 'dashboard-report-table';
    const head = document.createElement('thead');
    const heading = document.createElement('tr');
    for (const header of headers) {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.textContent = header;
        heading.append(cell);
    }
    head.append(heading);
    const body = document.createElement('tbody');
    for (const row of rows) {
        const tr = document.createElement('tr');
        for (const value of row) {
            const cell = document.createElement('td');
            cell.textContent = value;
            tr.append(cell);
        }
        body.append(tr);
    }
    table.append(head, body);
    wrapper.append(table);
    return wrapper;
}

function dashboardReportBar(value, maximum) {
    const track = document.createElement('div');
    track.className = 'dashboard-report-bar-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div');
    fill.className = 'dashboard-report-bar-fill';
    const bounded = value < 0n ? 0n : value > maximum ? maximum : value;
    const basisPoints = maximum > 0n ? (bounded * 10000n + maximum / 2n) / maximum : 0n;
    fill.style.width = `${Number(basisPoints) / 100}%`;
    track.append(fill);
    return track;
}

function dashboardDistrictCompletion(districts) {
    const section = document.createElement('section');
    section.className = 'district-completion';
    const title = document.createElement('h2');
    title.textContent = 'Accomplissement du planning par district';
    const explanation = document.createElement('p');
    explanation.textContent = 'Vert : livré · Gris : non livré, y compris les quantités en cours de livraison ou en transit.';
    section.append(title, explanation);
    if (!districts.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Aucun district dans ce planning.';
        section.append(empty);
        return section;
    }
    const grid = document.createElement('div');
    grid.className = 'district-completion-grid';
    for (const district of districts) {
        const card = document.createElement('article');
        card.className = 'district-completion-card';
        const name = document.createElement('h3');
        name.textContent = district.name;
        const planned = district.planned;
        const delivered = district.delivered;
        const label = document.createElement('p');
        if (planned > 0n) {
            const bounded = delivered < 0n ? 0n : delivered > planned ? planned : delivered;
            const basisPoints = (bounded * 10000n + planned / 2n) / planned;
            const percent = (delivered * 100n + planned / 2n) / planned;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 42 42');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('class', 'district-completion-pie');
            const base = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            for (const circle of [base, fill]) {
                circle.setAttribute('cx', '21');
                circle.setAttribute('cy', '21');
                circle.setAttribute('r', '10');
                circle.setAttribute('fill', 'none');
                circle.setAttribute('stroke-width', '20');
                circle.setAttribute('pathLength', '100');
            }
            base.setAttribute('stroke', '#e2e8f0');
            fill.setAttribute('stroke', '#059669');
            fill.setAttribute('stroke-dasharray', `${Number(basisPoints) / 100} 100`);
            fill.setAttribute('transform', 'rotate(-90 21 21)');
            svg.append(base, fill);
            label.textContent = `${percent} % livré · ${delivered.toLocaleString('fr-FR')} / ${planned.toLocaleString('fr-FR')} prévus`;
            card.append(name, svg, label);
        } else {
            label.textContent = `Accomplissement indisponible : aucune quantité prévue · ${delivered.toLocaleString('fr-FR')} livré(s).`;
            card.append(name, label);
        }
        grid.append(card);
    }
    section.append(grid);
    return section;
}

function renderDashboardReport(data, container) {
    function text(tag, value, className) {
        const node = document.createElement(tag);
        node.textContent = value;
        if (className) node.className = className;
        container.append(node);
    }
    const number = value => BigInt(value).toLocaleString('fr-FR');
    const percent = (delivered, planned) => planned === 0n ? 'N/A' : `${(delivered * 100n + planned / 2n) / planned} %`;
    const itemText = items => items.map(item =>
        `${item.name} · lot ${item.lot} : ${number(item.quantity)} ${item.unit}`).join(' ; ') || 'Aucun détail';
    const totals = { planned: 0n, delivered: 0n, flight: 0n, transit: 0n, remaining: 0n, flights: 0 };
    const districtFlights = new Map();
    const districtTotals = new Map();
    for (const csb of data.csbs) {
        const districtName = csb.district || 'District non renseigné';
        if (!districtTotals.has(districtName)) districtTotals.set(districtName, {name:districtName, planned:0n, delivered:0n});
        const districtTotal = districtTotals.get(districtName);
        totals.flights += csb.flights.length;
        districtFlights.set(csb.district, (districtFlights.get(csb.district) || 0) + csb.flights.length);
        for (const item of csb.items) {
            const planned = BigInt(item.planned), delivered = BigInt(item.delivered);
            districtTotal.planned += planned;
            districtTotal.delivered += delivered;
            const flight = BigInt(item.in_flight), transit = BigInt(item.in_transit);
            const remaining = planned - delivered - flight - transit;
            totals.planned += planned;
            totals.delivered += delivered;
            totals.flight += flight;
            totals.transit += transit;
            totals.remaining += remaining > 0n ? remaining : 0n;
        }
    }
    const header = document.createElement('div');
    header.className = 'report-header';
    const logo = document.createElement('img');
    logo.className = 'report-logo';
    logo.src = 'logo-unfpa.svg';
    logo.alt = 'Logo UNFPA';
    const meta = document.createElement('div');
    meta.className = 'report-header-meta';
    const label = document.createElement('strong');
    label.textContent = 'Rapport de suivi du planning';
    const port = document.createElement('div');
    port.textContent = data.port;
    meta.append(label, port);
    header.append(logo, meta);
    container.append(header);
    text('h1', `Rapport de suivi du planning ${data.code}`);
    text('p', `${data.port} · ${data.start_date} au ${data.end_date} · ${data.csbs.length} CSB · Édité le ${new Date(data.generated_at).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (heure de Madagascar)`);
    const summary = document.createElement('p');
    summary.className = 'dashboard-report-totals';
    const values = [
        ['Prévu', number(totals.planned)],
        ['Livré', `${number(totals.delivered)} (${percent(totals.delivered, totals.planned)})`],
        ['Livraison en cours', number(totals.flight)],
        ['Transit terrestre', number(totals.transit)],
        ['Reste à prévoir', number(totals.remaining)],
        ['Vols clôturés', number(totals.flights)]
    ];
    for (const [label, value] of values) {
        const entry = document.createElement('span');
        const title = document.createElement('span');
        title.textContent = `${label} : `;
        const amount = document.createElement('strong');
        amount.textContent = value;
        entry.append(title, amount);
        summary.append(entry);
    }
    container.append(summary);
    container.append(dashboardDistrictCompletion([...districtTotals.values()]));
    text('p', "Les totaux additionnent des intrants de conditionnements différents. Livré inclut les expéditions clôturées ; les transits ne sont pas livrés. Les opérations annulées sont exclues.");
    const progressChart = document.createElement('section');
    progressChart.className = 'dashboard-report-chart';
    const progressTitle = document.createElement('h2');
    progressTitle.textContent = 'Avancement global des livraisons';
    const progressText = document.createElement('p');
    progressText.textContent = `${number(totals.delivered)} livrés / ${number(totals.planned)} prévus · ${percent(totals.delivered, totals.planned)}`;
    progressChart.append(progressTitle, progressText);
    if (totals.planned > 0n) progressChart.append(dashboardReportBar(totals.delivered, totals.planned));
    else {
        const empty = document.createElement('p');
        empty.textContent = 'Avancement indisponible : aucune quantité prévue.';
        progressChart.append(empty);
    }
    container.append(progressChart);
    const districtChart = document.createElement('section');
    districtChart.className = 'dashboard-report-chart dashboard-report-district-chart';
    const districtTitle = document.createElement('h2');
    districtTitle.textContent = 'Vols clôturés par district';
    districtChart.append(districtTitle);
    if (!districtFlights.size) {
        const empty = document.createElement('p');
        empty.textContent = 'Aucun district dans ce planning.';
        districtChart.append(empty);
    }
    else {
        const maxFlights = [...districtFlights.values()].reduce((max, count) => Math.max(max, count), 0);
        for (const [name, count] of districtFlights) {
            const row = document.createElement('div');
            row.className = 'dashboard-report-chart-row';
            const label = document.createElement('span');
            label.textContent = name;
            const countLabel = document.createElement('strong');
            countLabel.textContent = `${count} vol(s) clôturé(s)`;
            row.append(label, dashboardReportBar(BigInt(count), BigInt(maxFlights)), countLabel);
            districtChart.append(row);
        }
        const total = document.createElement('p');
        total.textContent = `Total du planning : ${number(totals.flights)} vol(s) clôturé(s).`;
        districtChart.append(total);
    }
    container.append(districtChart);
    text('h2', 'Détails par district et CSB');
    if (!data.csbs.length) text('p', 'Aucun CSB dans ce planning.');
    let district = null;
    for (const csb of data.csbs) {
        if (csb.district !== district) {
            district = csb.district;
            const count = districtFlights.get(district);
            text('h3', `${district} · ${count} vol(s) clôturé(s)`, 'dashboard-report-district-heading');
        }
        const csbHeading = document.createElement('h4');
        csbHeading.className = 'dashboard-report-csb-heading';
        const csbName = document.createElement('span');
        csbName.textContent = csb.name;
        const flightCount = document.createElement('strong');
        flightCount.className = 'dashboard-report-flight-count';
        flightCount.textContent = `${number(csb.flights.length)} vol(s) clôturé(s)`;
        csbHeading.append(csbName, flightCount);
        container.append(csbHeading);
        container.append(dashboardReportTable(['Intrant', 'Prévu', 'Livré', 'Transit terrestre', 'En vol', 'Reste à prévoir', 'Livré %'],
            csb.items.map(item => {
                const planned = BigInt(item.planned), delivered = BigInt(item.delivered);
                const remaining = planned - delivered - BigInt(item.in_flight) - BigInt(item.in_transit);
                return [`${item.name} (${item.unit})`, number(planned), number(delivered), number(item.in_transit),
                    number(item.in_flight), number(remaining > 0n ? remaining : 0n), percent(delivered, planned)];
            })));
        text('h4', 'Vols clôturés');
        if (!csb.flights.length) text('p', 'Aucun vol clôturé.');
        else container.append(dashboardReportTable(['BL', 'Date de clôture', 'Intrants et lots'],
            csb.flights.map(f => [f.bl, f.closed_date || 'Non renseignée', itemText(f.items)])));
        text('h4', 'Expéditions terrestres');
        if (!csb.shipments.length) text('p', 'Aucune expédition terrestre.');
        else container.append(dashboardReportTable(['Référence', 'Date', 'Statut', 'Transport', 'Intrants et lots'],
            csb.shipments.map(s => [s.reference, s.closed_date ? `${s.closed_date} (clôture)` :
                `${new Date(s.dispatched_at).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (expédition)`,
                s.status, s.transport, itemText(s.items)])));
    }
    text('h2', 'État du stock du drone port');
    text('p', 'Stock enregistré incluant les réservations des vols en cours et excluant la quarantaine.');
    if (!data.stocks.length) text('p', 'Aucun stock pour ce drone port.');
    else container.append(dashboardReportTable(['Intrant', 'Lot', 'Péremption', 'Stock', 'Réservé', 'Disponible'],
        data.stocks.map(s => [`${s.name} (${s.unit})`, s.lot, s.expiry_date || 'Non renseignée',
            number(s.quantity), number(s.reserved), number(BigInt(s.quantity) - BigInt(s.reserved))])));
}
