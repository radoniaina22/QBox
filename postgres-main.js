'use strict';

(() => {
    const $ = id => document.getElementById(id);
    const roles = { admin: 'Admin', pilot: 'Pilote', pilot_rd: 'Pilote RD', logistics: 'Coordinateur logistique', unfpa: 'UNFPA' };
    let config;
    let token = null;
    // A credential rotation keeps the session identity; login and logout replace it.
    let sessionGeneration = 0;
    let refreshToken = null;
    let tokenExpiresAt = 0;
    let sessionRefresh = null;
    let sessionRefreshTimer = null;
    let requestSequence = 0;
    let loginInProgress = false;
    let activeView = 'dashboard';
    let frame = null;
    let frameConnected = false;
    let operationSection = '';
    let userRole = null;
    const hasRole = allowed => QBoxAuthPolicy.roleMatches(userRole, allowed);
    let passwordIdentity = null;
    let passwordGeneration = 0;
    let passwordSaving = false;
    let stockRows = [];
    let receiptId = null;
    let receiptPort = null;
    let receiptSaving = false;
    let receiptOpening = false;
    let catalogRows = [];
    let productEditing = null;
    let productOpen = false;
    let productSaving = false;
    let productLoading = false;
    let csbOpen = false;
    let csbSaving = false;
    let csbLoading = false;
    let csbPort = null;
    let csbEditing = null;
    let geography = [];
    let portFormOpen = false;
    let portSaving = false;
    let portLoading = false;
    let portEditing = null;
    let planningDraft = null;
    let planningSaving = false;
    let planningLoading = false;
    let archiveDraft = null;
    let planningCsbs = [];
    let planningProducts = [];
    let flightDraft = null;
    let flightLoading = false;
    let flightSaving = false;
    let shipmentDraft = null;
    let shipmentLoading = false;
    let shipmentSaving = false;
    let inventoryDraft = null;
    let inventoryLoading = false;
    let inventorySaving = false;
    let quarantineDraft = null;
    let quarantineLoading = false;
    let quarantineSaving = false;
    let deliveryCloseDraft = null;
    let deliveryCloseLoading = false;
    let deliveryCloseSaving = false;
    let deliveryEditDraft = null;
    let deliveryEditLoading = false;
    let deliveryEditSaving = false;
    let deliveryPrintDraft = null;
    let deliveryPrintSequence = 0;
    let planningPrintDraft = null;
    let planningPrintSequence = 0;
    let stockHistoryState = null;
    let logisticsReportSequence = 0;
    let logisticsReportState = null;
    let stockHistoryCharts = [];
    let stockHistoryPrintOpen = false;
    let dashboardStockChart = null;
    let dashboardReportPort = null;
    let dashboardReportSequence = 0;
    let inventoryPrintDraft = null;
    let inventoryPrintSequence = 0;
    let warehouseRows = [];
    let transferStocks = [];
    let transferSaving = false;
    let transferRequestId = null;
    const lockedForms = new Map();
    function markFormLocked(id) {
        lockedForms.set(id, (lockedForms.get(id) || 0) + 1);
    }
    function unmarkFormLocked(id) {
        const remaining = (lockedForms.get(id) || 0) - 1;
        if (remaining > 0) lockedForms.set(id, remaining);
        else lockedForms.delete(id);
    }
    const nativeViewIds = ['stocks', 'salama', 'products', 'csb', 'ports', 'planning', 'archives', 'drones', 'history', 'sorties', 'inventory', 'quarantine', 'stock-history', 'logistics-report', 'transfers'];
    const portSelect = $('drone-port-select');
    const login = $('main-login');
    const notice = $('postgres-dashboard-notice');
    const status = $('postgres-login-status');
    const localDateTime = value => new Date(value).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' });
    const cargo = entries => entries.map(i => `${i.product_name || i.name} · lot ${i.lot} : ${number(i.quantity)}`).join(' ; ') || 'Aucun détail';
    const readViews = {
        stocks: { title: 'Stocks et lots', rpc: 'qbox_list_stocks', port: true,
            columns: ['Intrant', 'Lot', 'Péremption', 'Stock', 'Réservé', 'Disponible', 'Unité'],
            row: s => [s.name, s.lot, s.expiry_date || 'Non renseignée', number(s.quantity), number(s.reserved), number(s.available), s.unit] },
        products: { title: 'Référentiel des intrants', rpc: 'qbox_list_products', port: false,
            columns: ['Code', 'Intrant', 'Catégorie', 'Unité', 'Seuil'],
            row: p => [p.code, p.name, p.category, p.unit, number(p.min_threshold)] },
        csb: { title: 'Réseau des CSB', rpc: 'qbox_list_csbs', port: true,
            columns: ['Code', 'CSB', 'Région', 'District', 'Distance (km)', 'Chef', 'Téléphones'],
            row: c => [c.code, c.name, c.region, c.district, String(c.distance_km), c.chief || 'Non renseigné', c.phones.join(', ') || 'Non renseignés'] },
        ports: { title: 'Gestion des magasins', rpc: 'qbox_list_ports', port: false,
            columns: ['Code', 'Nom', 'Région'],
            row: p => [p.code, p.name, p.region] },
        planning: { title: 'Besoins prévisionnels', rpc: 'qbox_list_plannings', port: true,
            filter: p => p.status === 'En cours',
            columns: ['Planning', 'Période', 'Besoins par CSB'],
            row: p => [p.code, `${p.start_date} au ${p.end_date}`, p.items.map(i => `${i.csb_name} · ${i.product_name} : prévu ${number(i.planned)}, livré ${number(i.delivered)}, en vol ${number(i.in_flight)}, transit terrestre ${number(i.in_transit)}, restant ${number(i.remaining)}`).join(' ; ')] },
        archives: { title: "Dossiers d'archives", rpc: 'qbox_list_plannings', port: true,
            filter: p => p.status === 'Archivé',
            columns: ['Planning', 'Période', 'Dossier', 'Besoins par CSB'],
            row: p => [p.code, `${p.start_date} au ${p.end_date}`, p.folder || 'Non renseigné',
                p.items.map(i => `${i.csb_name} · ${i.product_name} : prévu ${number(i.planned)}, livré ${number(i.delivered)}, en vol ${number(i.in_flight)}, transit terrestre ${number(i.in_transit)}, restant ${number(i.remaining)}`).join(' ; ')] },
        drones: { title: 'Vols en cours', rpc: 'qbox_list_flights', port: true,
            filter: f => f.status === 'En vol',
            columns: ['BL', 'Planning', 'CSB', 'Départ', 'Colis'],
            row: f => [f.bl, f.planning_code, f.csb_name, localDateTime(f.departed_at), cargo(f.items)] },
        history: { title: 'Historique des vols', rpc: 'qbox_list_flights', port: true,
            filter: f => f.status !== 'En vol',
            columns: ['BL', 'Planning', 'CSB', 'Statut', 'Clôture', 'Colis'],
            row: f => [f.bl, f.planning_code, f.csb_name, f.status, f.closed_date || 'Non renseignée', cargo(f.items)] },
        sorties: { title: 'Expéditions terrestres', rpc: 'qbox_list_shipments', port: true,
            columns: ['Référence', 'Planning', 'CSB', 'Transport', 'Statut', 'Expédition', 'Clôture', 'Intrants'],
            row: s => [s.reference, s.planning_code, s.csb_name, s.transport, s.status,
                localDateTime(s.dispatched_at), s.closed_date || 'Non renseignée', cargo(s.items)] },
        salama: { title: 'Réceptions SALAMA', rpc: 'qbox_list_receipts', port: true,
            columns: ['Référence', 'Réception', 'Intrants et lots'],
            row: r => [r.reference, localDateTime(r.received_at), cargo(r.items)] },
        quarantine: { title: 'Quarantaine', rpc: 'qbox_list_quarantines', port: true,
            columns: ['Intrant', 'Lot', 'Péremption', 'Quantité', 'Motif', 'Statut', 'Date'],
            row: q => [q.product_name, q.lot, q.expiry_date || 'Non renseignée', number(q.quantity), q.reason, q.status, localDateTime(q.created_at)] },
        inventory: { title: 'Inventaires physiques', rpc: 'qbox_list_inventories', port: true,
            columns: ['Date', 'Détail par lot : attendu, compté et écart'],
            row: inventory => [localDateTime(inventory.created_at), inventory.items.map(i =>
                `${i.product_name} · lot ${i.lot} : attendu ${number(BigInt(i.system_quantity) - BigInt(i.in_delivery))}, compté ${number(i.counted)}, écart ${number(i.difference)}`).join(' ; ') || 'Aucun détail'] },
        'stock-history': { title: 'Historique global des stocks' },
        'logistics-report': { title: 'Rapport logistique' },
        transfers: { title: 'Transferts et expéditions terrestres' }
    };

    function setText(id, value) { $(id).textContent = value; }

    function isStorage() {
        return warehouseRows.find(port => port.id === portSelect.value)?.site_type === 'storage';
    }

    function updateSiteNavigation() {
        const storage = isStorage();
        for (const id of ['planning-navigation', 'nav-drones', 'nav-history', 'nav-sorties', 'nav-csb',
            'dashboard-missions-kpi', 'dashboard-planning-kpi', 'dashboard-network-kpi', 'dashboard-progress-kpi',
            'dashboard-missions-card', 'dashboard-planning-card'])
            $(id).classList.toggle('postgres-hidden', storage);
        $('dashboard-storage-card').classList.toggle('postgres-hidden', !storage);
        $('legacy-new-flight').classList.toggle('postgres-hidden', storage || !hasRole(['admin', 'pilot']));
        $('legacy-dashboard-report').classList.toggle('postgres-hidden', storage);
        $('dashboard-site-description').textContent = storage ? 'Suivi des stocks du magasin de stockage' : 'Suivi des activités du drone port';
    }

    function setFormTitle(id, iconName, color, text) {
        const icon = document.createElement('i');
        icon.className = `ph ${iconName} ${color} mr-2 text-lg`;
        icon.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.textContent = text;
        $(id).replaceChildren(icon, label);
    }
    function showLogin() {
        sessionGeneration++;
        logisticsReportSequence++;
        logisticsReportState = null;
        $('logistics-report-months').replaceChildren();
        $('logistics-report-status').textContent = '';
        $('logistics-report-print-context').textContent = '';
        $('logistics-report-print').disabled = true;
        document.body.classList.remove('logistics-report-print-mode');
        passwordGeneration++;
        passwordIdentity = null;
        passwordSaving = false;
        $('password-submit').disabled = false;
        $('password-cancel').disabled = false;
        $('password-form').reset();
        if ($('password-dialog').open) $('password-dialog').close();
        requestSequence++;
        token = null;
        refreshToken = null;
        tokenExpiresAt = 0;
        sessionRefresh = null;
        for (const id of lockedForms.keys())
            for (const control of $(id).querySelectorAll('input, select, textarea, button')) control.disabled = false;
        lockedForms.clear();
        for (const id of ['product-close', 'csb-close', 'planning-close', 'archive-close', 'salama-close',
            'close-delivery-x', 'delivery-edit-close', 'drone-close', 'sortie-close',
            'planning-print-button', 'postgres-print-document', 'dashboard-report-print'])
            $(id).disabled = false;
        productLoading = productSaving = csbLoading = csbSaving = portLoading = portSaving = false;
        planningLoading = planningSaving = flightLoading = flightSaving = shipmentLoading = shipmentSaving = false;
        inventoryLoading = inventorySaving = quarantineLoading = quarantineSaving = false;
        deliveryCloseLoading = deliveryCloseSaving = deliveryEditLoading = deliveryEditSaving = false;
        receiptOpening = receiptSaving = transferSaving = false;
        warehouseRows = [];
        transferStocks = [];
        transferRequestId = null;
        $('transfer-form').reset();
        $('transfer-form').classList.add('postgres-hidden');
        $('transfer-items').replaceChildren();
        $('transfer-list').replaceChildren();
        if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
        sessionRefreshTimer = null;
        userRole = null;
        frameConnected = false;
        frame = null;
        $('postgres-frame-container').replaceChildren();
        $('postgres-operations-view').classList.add('postgres-hidden');
        portSelect.disabled = false;
        $('main-app').classList.add('postgres-hidden');
        $('auth-screen').classList.remove('postgres-hidden');
        portSelect.replaceChildren();
        clearDashboard();
        $('postgres-read-content').replaceChildren();
        $('postgres-read-status').textContent = '';
        for (const id of nativeViewIds) $(`view-${id}`).classList.add('hidden');
        $('stocks-table-body').replaceChildren();
        $('salama-table-body').replaceChildren();
        stockRows = [];
        catalogRows = [];
        productOpen = false;
        productEditing = null;
        $('catalog-table-body').replaceChildren();
        $('modal-product').classList.add('hidden');
        $('form-product').reset();
        csbOpen = false;
        csbPort = null;
        csbEditing = null;
        geography = [];
        $('csb-table-body').replaceChildren();
        $('modal-csb').classList.add('hidden');
        $('form-csb').reset();
        portFormOpen = false;
        portEditing = null;
        $('ports-table-body').replaceChildren();
        $('port-form').classList.add('hidden');
        $('port-form').reset();
        $('planning-cards-container').replaceChildren();
        $('archives-container').replaceChildren();
        $('drones-groups').replaceChildren();
        $('history-table-body').replaceChildren();
        $('sorties-table-body').replaceChildren();
        planningDraft = null;
        archiveDraft = null;
        planningCsbs = [];
        planningProducts = [];
        $('modal-planning').classList.add('hidden');
        $('modal-archive').classList.add('hidden');
        $('plan-csb-blocks').replaceChildren();
        flightDraft = null;
        $('modal-drone').classList.add('hidden');
        $('drone-flights-container').replaceChildren();
        $('drone-active-planning').replaceChildren();
        shipmentDraft = null;
        $('modal-sortie').classList.add('hidden');
        $('sortie-items').replaceChildren();
        $('postgres-sortie-needs').replaceChildren();
        inventoryDraft = null;
        $('inventory-form').classList.add('hidden');
        $('inventory-count-rows').replaceChildren();
        $('inventory-history').replaceChildren();
        stockHistoryState = null;
        clearStockHistoryCharts();
        stockHistoryPrintOpen = false;
        $('stock-history-print-modal').classList.add('hidden');
        $('stock-history-print-content').replaceChildren();
        document.body.classList.remove('stock-history-print-mode');
        dashboardReportSequence++;
        dashboardReportPort = null;
        $('report-preview-modal').classList.add('hidden');
        $('dashboard-report').replaceChildren();
        document.body.classList.remove('report-print-mode');
        inventoryPrintSequence++;
        inventoryPrintDraft = null;
        $('inventory-print-modal').classList.add('hidden');
        $('inventory-print-report').replaceChildren();
        document.body.classList.remove('postgres-inventory-print');
        for (const id of ['stock-history-summary', 'stock-history-movements', 'stock-history-inventories']) $(id).replaceChildren();
        $('stock-history-status').textContent = '';
        for (const id of ['stock-history-from', 'stock-history-to', 'stock-history-type', 'stock-history-search']) $(id).value = '';
        $('postgres-stock-history-more').classList.add('hidden');
        $('inventory-new').disabled = false;
        quarantineDraft = null;
        $('quarantine-form-main').classList.add('hidden');
        $('quarantine-stock').replaceChildren();
        $('quarantine-list').replaceChildren();
        $('postgres-quarantine-new').disabled = false;
        deliveryCloseDraft = null;
        $('modal-close-drone').classList.add('hidden');
        $('postgres-close-delivery-detail').replaceChildren();
        deliveryEditDraft = null;
        $('modal-delivery-edit').classList.add('hidden');
        $('delivery-edit-items').replaceChildren();
        $('delivery-edit-needs').replaceChildren();
        deliveryPrintSequence++;
        deliveryPrintDraft = null;
        $('print-preview-modal').classList.add('hidden');
        $('print-items-body').replaceChildren();
        document.body.classList.remove('postgres-bl-print');
        planningPrintSequence++;
        planningPrintDraft = null;
        $('planning-print-modal').classList.add('hidden');
        $('planning-print-content').replaceChildren();
        document.body.classList.remove('postgres-planning-print');
        receiptId = null;
        receiptPort = null;
        $('modal-salama').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('salama-items').replaceChildren();
        $('salama-id').value = '';
        activeView = 'dashboard';
        setText('user-display-name', '');
        setText('user-display-role', '');
        setText('user-avatar', '');
        setText('active-port-badge', '');
    }

    function setSession(session) {
        token = session.access_token;
        refreshToken = session.refresh_token || null;
        const expiresIn = Number(session.expires_in);
        tokenExpiresAt = Number.isFinite(expiresIn) && expiresIn > 0
            ? Date.now() + expiresIn * 1000 : 0;
        if (sessionRefreshTimer) clearTimeout(sessionRefreshTimer);
        sessionRefreshTimer = null;
        if (refreshToken && tokenExpiresAt) {
            const scheduledToken = token;
            const scheduledGeneration = sessionGeneration;
            const timer = setTimeout(() => {
                if (sessionRefreshTimer !== timer || sessionGeneration !== scheduledGeneration ||
                    token !== scheduledToken || !refreshToken) return;
                sessionRefreshTimer = null;
                refreshSession().catch(error => {
                    if (!token || sessionGeneration !== scheduledGeneration) return;
                    showLogin();
                    status.textContent = `Session expirée : ${error.message} Reconnectez-vous.`;
                });
            }, Math.max(0, tokenExpiresAt - Date.now() - 30000));
            sessionRefreshTimer = timer;
        }
    }

    async function refreshSession() {
        if (!refreshToken) throw new Error('Session expirée : reconnectez-vous.');
        if (sessionRefresh) return sessionRefresh;
        const requestGeneration = sessionGeneration;
        const requestToken = token;
        const requestRefreshToken = refreshToken;
        const pending = (async () => {
            try {
                const response = await fetch(config.url + '/auth/v1/token?grant_type=refresh_token', {
                    method: 'POST',
                    headers: { apikey: config.key, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: requestRefreshToken })
                });
                const result = await response.json().catch(() => null);
                if (!response.ok || !result?.access_token) {
                    throw new Error(result?.message || result?.error_description || 'Le renouvellement de session a échoué.');
                }
                if (sessionGeneration !== requestGeneration || token !== requestToken || refreshToken !== requestRefreshToken) return;
                setSession(result);
                if (frameConnected) sendFrame({ type: 'qbox-session-updated', token });
            } catch (error) {
                if (sessionGeneration === requestGeneration && token === requestToken && refreshToken === requestRefreshToken) {
                    showLogin();
                    status.textContent = `Session expirée : ${error.message} Reconnectez-vous.`;
                }
                throw error;
            }
        })();
        sessionRefresh = pending;
        try {
            await pending;
        } finally {
            if (sessionRefresh === pending) sessionRefresh = null;
        }
    }

    async function api(path, body, authenticated = false, retried = false) {
        if (!config) throw new Error('Configuration PostgreSQL locale indisponible.');
        const requestGeneration = sessionGeneration;
        if (authenticated && refreshToken && tokenExpiresAt && tokenExpiresAt <= Date.now() + 30000) {
            await refreshSession();
        }
        if (authenticated && requestGeneration !== sessionGeneration) throw new Error('Session remplacée.');
        const requestToken = token;
        const response = await fetch(config.url + path, {
            method: 'POST',
            headers: { apikey: config.key, 'Content-Type': 'application/json',
                ...(authenticated ? { Authorization: `Bearer ${requestToken}` } : {}) },
            body: JSON.stringify(body)
        });
        const result = await response.json().catch(() => null);
        if (authenticated && requestGeneration !== sessionGeneration) throw new Error('Session remplacée.');
        if (response.status === 401 && authenticated && !retried) {
            if (token === requestToken && refreshToken) await refreshSession();
            if (requestGeneration !== sessionGeneration) throw new Error('Session remplacée.');
            if (token && token !== requestToken) return api(path, body, authenticated, true);
        }
        if (!response.ok) {
            if (response.status === 401 && authenticated && token) {
                showLogin();
                status.textContent = 'Session expirée : reconnectez-vous.';
                throw new Error('Session expirée : reconnectez-vous.');
            }
            throw new Error(result?.message || result?.error_description || result?.msg || `Erreur serveur (${response.status}).`);
        }
        if (authenticated && /\/qbox_(stock_history|planning_history|list_inventories|list_quarantines|flight_details|shipment_details)$/.test(path)) {
            await enrichHistoryActors(path, result, actorIds =>
                api('/rest/v1/rpc/qbox_history_actor_names', {actor_ids: actorIds}, true));
            if (requestGeneration !== sessionGeneration) throw new Error('Session remplacée.');
        }
        return result;
    }

    function clearDashboard() {
        for (const id of ['dash-total-stock', 'dash-active-drones', 'dash-active-plannings', 'dash-total-csb',
            'dash-global-rate', 'dash-global-ratio']) setText(id, '—');
        $('dash-global-bar').style.width = '0%';
        for (const id of ['dash-missions-list', 'dash-plannings-table', 'dash-expirations-list']) $(id).replaceChildren();
        if (dashboardStockChart) dashboardStockChart.destroy();
        dashboardStockChart = null;
        $('stock-chart-details-body').replaceChildren();
        $('stock-chart-message').classList.add('hidden');
        $('stock-chart-message').textContent = '';
        $('stock-chart-scroll').classList.remove('hidden');
        $('stock-chart-details').classList.remove('hidden');
    }

    function addLine(parent, text) {
        const p = document.createElement('p');
        p.textContent = text;
        parent.append(p);
    }

    function tableRow(values, classes = '') {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50 transition-colors';
        for (const value of values) {
            const cell = document.createElement('td');
            cell.className = `py-3 px-4 text-slate-700 ${classes}`;
            cell.textContent = value;
            row.append(cell);
        }
        return row;
    }

    function emptyTableRow(message, columns) {
        const row = tableRow([message]);
        row.children[0].colSpan = columns;
        row.children[0].className = 'p-6 text-center text-slate-400 italic';
        return row;
    }

    function renderStocks() {
        const body = $('stocks-table-body');
        body.replaceChildren();
        const query = $('stock-search').value.trim().toLocaleLowerCase('fr-FR');
        const rows = stockRows.filter(row => [row.name, row.lot, row.category, row.code]
            .some(value => String(value || '').toLocaleLowerCase('fr-FR').includes(query)));
        for (const row of rows) {
            const tr = tableRow([row.code || '—', row.name, row.category, row.lot, row.expiry_date || 'Non renseignée',
                `${number(row.quantity)} · ${row.unit}`, `${number(row.reserved)} réservé · ${number(row.available)} disponible`]);
            tr.children[0].className += ' font-mono font-bold';
            tr.children[1].className += ' font-bold text-slate-900';
            tr.children[3].className += ' font-mono';
            tr.children[4].className += ' font-mono';
            tr.children[5].className += ' text-right font-mono font-bold text-slate-900';
            tr.children[6].className += ' text-center';
            body.append(tr);
        }
        if (!rows.length) body.append(emptyTableRow('Aucun stock correspondant.', 7));
    }

    function renderCatalog() {
        const body = $('catalog-table-body');
        body.replaceChildren();
        const query = $('catalog-search').value.trim().toLocaleLowerCase('fr-FR');
        const products = catalogRows.filter(product => [product.code, product.name, product.category]
            .some(value => String(value || '').toLocaleLowerCase('fr-FR').includes(query)));
        for (const product of products) {
            const row = tableRow([product.code, product.name, product.category, product.unit, number(product.min_threshold)]);
            row.children[0].className += ' font-mono font-bold';
            row.children[1].className += ' font-bold text-slate-900';
            row.children[4].className += ' text-center font-mono font-bold';
            const actions = document.createElement('td');
            actions.className = 'py-3 px-4 text-right';
            if (hasRole(['admin', 'logistics'])) {
                for (const [label, action] of [
                    ['Modifier', () => openProduct(product)],
                    ['Supprimer', () => deleteProduct(product)]
                ]) {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = `px-2 py-1 ml-2 rounded-lg text-xs font-bold ${label === 'Supprimer' ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`;
                    button.textContent = label;
                    button.addEventListener('click', action);
                    actions.append(button);
                }
            } else actions.textContent = 'Lecture seule';
            row.append(actions);
            body.append(row);
        }
        if (!products.length) body.append(emptyTableRow('Aucun intrant correspondant.', 6));
    }

    async function refreshCatalog() {
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        $('catalog-table-body').replaceChildren();
        catalogRows = [];
        $('postgres-products-status').textContent = 'Chargement…';
        try {
            const products = await api('/rest/v1/rpc/qbox_list_products', {}, true);
            if (seq !== requestSequence || activeView !== 'products' || sessionGeneration !== requestGeneration) return;
            catalogRows = products;
            renderCatalog();
            $('postgres-products-status').textContent = `${products.length} intrant(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (seq !== requestSequence || activeView !== 'products' || sessionGeneration !== requestGeneration) return;
            $('postgres-products-status').textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    async function openProduct(product = null) {
        if (!hasRole(['admin', 'logistics'])) {
            $('postgres-products-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (productLoading || productSaving) return;
        const requestGeneration = sessionGeneration;
        productLoading = true;
        try {
            const categories = await api('/rest/v1/rpc/qbox_list_categories', {}, true);
            if (sessionGeneration !== requestGeneration || activeView !== 'products') return;
            if (!categories.length) throw new Error('Aucune catégorie disponible.');
            productEditing = product?.id || null;
            productOpen = true;
            $('form-product').reset();
            $('product-category').replaceChildren();
            for (const category of categories) $('product-category').add(new Option(category.name, category.id));
            $('product-code').value = product?.code || 'Généré à l’enregistrement';
            $('product-name').value = product?.name || '';
            $('product-unit').value = product?.unit || '';
            $('product-min-threshold').value = product?.min_threshold ?? 0;
            if (product) $('product-category').value = product.category_id;
            setFormTitle('product-modal-title', product ? 'ph-pencil' : 'ph-dna', 'text-teal-600',
                product ? "Modifier l'intrant médical" : 'Référencer un intrant médical');
            $('product-submit-btn').textContent = product ? 'Mettre à jour' : 'Enregistrer au catalogue';
            $('postgres-product-form-status').textContent = '';
            $('modal-backdrop').classList.remove('hidden');
            $('modal-product').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration && activeView === 'products') $('postgres-products-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) productLoading = false; }
    }

    function closeProduct() {
        if (productSaving) return;
        productOpen = false;
        productEditing = null;
        $('modal-product').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
    }

    async function submitProduct(event) {
        event.preventDefault();
        if (!productOpen || productSaving || !hasRole(['admin', 'logistics'])) return;
        const thresholdValue = $('product-min-threshold').value.trim();
        const threshold = Number(thresholdValue);
        const name = $('product-name').value.trim();
        const unit = $('product-unit').value.trim();
        const category = $('product-category').value;
        if (!name || !unit || !category || !thresholdValue || !Number.isSafeInteger(threshold) || threshold < 0) {
            $('postgres-product-form-status').textContent = 'Indiquez un nom, une catégorie, un conditionnement et un seuil entier valide.';
            return;
        }
        const requestGeneration = sessionGeneration;
        productSaving = true;
        markFormLocked('form-product');
        for (const control of $('form-product').querySelectorAll('input, select, button')) control.disabled = true;
        $('product-close').disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_save_product', {
                product_id: productEditing, product_name: name, product_category: category,
                product_unit: unit, product_threshold: threshold
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            productSaving = false;
            closeProduct();
            if (frameConnected) sendFrame({ type: 'qbox-catalog-changed' });
            await refreshCatalog();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-products-status').textContent += ' Intrant enregistré.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-product-form-status').textContent = `${error.message} Après une interruption, actualisez le catalogue avant de recommencer.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('form-product');
                productSaving = false;
                for (const control of $('form-product').querySelectorAll('input, select, button')) control.disabled = false;
                $('product-close').disabled = false;
            }
        }
    }

    async function deleteProduct(product) {
        if (!hasRole(['admin', 'logistics']) || productSaving ||
            !confirm(`Supprimer l'intrant « ${product.name} » ?`)) return;
        const requestGeneration = sessionGeneration;
        productSaving = true;
        try {
            await api('/rest/v1/rpc/qbox_delete_product', { product_id: product.id }, true);
            if (sessionGeneration !== requestGeneration || activeView !== 'products') return;
            if (frameConnected) sendFrame({ type: 'qbox-catalog-changed' });
            await refreshCatalog();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-products-status').textContent += ' Intrant supprimé.';
        } catch (error) {
            if (sessionGeneration === requestGeneration && activeView === 'products')
                $('postgres-products-status').textContent = `${error.message} Actualisez le catalogue pour vérifier le résultat.`;
        } finally { if (sessionGeneration === requestGeneration) productSaving = false; }
    }

    async function refreshCsbs() {
        const port = portSelect.value;
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        const body = $('csb-table-body');
        body.replaceChildren();
        $('postgres-csb-status').textContent = port ? 'Chargement…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const csbs = await api('/rest/v1/rpc/qbox_list_csbs', { selected_port: port }, true);
            if (seq !== requestSequence || activeView !== 'csb' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            for (const csb of csbs) {
                const row = tableRow([csb.code, csb.name, csb.region, csb.district, csb.chief || 'Non renseigné',
                    csb.phones.join(', ') || 'Non renseignés', `${csb.distance_km} km`]);
                row.children[0].className += ' font-mono font-bold';
                row.children[1].className += ' font-bold text-slate-900';
                row.children[6].className += ' text-right font-mono font-bold';
                const actions = document.createElement('td');
                actions.className = 'py-3 px-4 text-right';
                if (hasRole(['admin', 'pilot', 'logistics'])) {
                    for (const [label, action] of [['Modifier', () => openCsb(csb)], ['Supprimer', () => deleteCsb(csb, port)]]) {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = `px-2 py-1 ml-2 rounded-lg text-xs font-bold ${label === 'Supprimer' ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`;
                        button.textContent = label;
                        button.addEventListener('click', action);
                        actions.append(button);
                    }
                } else actions.textContent = 'Lecture seule';
                row.append(actions);
                body.append(row);
            }
            if (!csbs.length) body.append(emptyTableRow('Aucun CSB pour ce port.', 8));
            $('postgres-csb-status').textContent = `${csbs.length} CSB · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (seq === requestSequence && activeView === 'csb' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-csb-status').textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    function updateCsbDistricts(selected) {
        const select = $('csb-district');
        select.replaceChildren();
        for (const item of geography.filter(item => item.region === $('csb-region').value))
            select.add(new Option(item.district, item.district));
        if (selected) select.value = selected;
    }

    async function openCsb(csb = null) {
        if (!hasRole(['admin', 'pilot', 'logistics'])) {
            $('postgres-csb-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (!portSelect.value) {
            $('postgres-csb-status').textContent = 'Sélectionnez un drone port.';
            return;
        }
        if (csbLoading || csbSaving) return;
        const requestGeneration = sessionGeneration;
        const port = portSelect.value;
        csbLoading = true;
        try {
            const result = await api('/rest/v1/rpc/qbox_geography', {}, true);
            if (sessionGeneration !== requestGeneration || activeView !== 'csb' || port !== portSelect.value) return;
            if (!result.length) throw new Error('Régions et districts indisponibles.');
            geography = result;
            csbPort = port;
            csbEditing = csb?.id || null;
            csbOpen = true;
            $('form-csb').reset();
            $('csb-region').replaceChildren();
            for (const region of new Set(geography.map(item => item.region))) $('csb-region').add(new Option(region, region));
            if (csb) $('csb-region').value = csb.region;
            updateCsbDistricts(csb?.district);
            $('csb-code').value = csb?.code || 'Généré à l’enregistrement';
            $('csb-name').value = csb?.name || '';
            $('csb-chief').value = csb?.chief || '';
            $('csb-phones').value = (csb?.phones || []).join('\n');
            $('csb-dist').value = csb?.distance_km ?? '';
            setFormTitle('csb-modal-title', csb ? 'ph-pencil' : 'ph-first-aid', 'text-rose-600',
                csb ? 'Modifier le CSB' : 'Enregistrer un CSB');
            $('csb-submit-btn').textContent = csb ? 'Mettre à jour' : 'Enregistrer';
            $('postgres-csb-form-status').textContent = '';
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-csb').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration && activeView === 'csb') $('postgres-csb-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) csbLoading = false; }
    }

    function closeCsb() {
        if (csbSaving) return;
        csbOpen = false;
        csbPort = null;
        csbEditing = null;
        $('modal-csb').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitCsb(event) {
        event.preventDefault();
        if (!csbOpen || csbSaving || !hasRole(['admin', 'pilot', 'logistics'])) return;
        const formStatus = $('postgres-csb-form-status');
        const distanceText = $('csb-dist').value.trim();
        const distance = Number(distanceText);
        const name = $('csb-name').value.trim();
        if (csbPort !== portSelect.value || !name || !distanceText || !Number.isFinite(distance) || distance < 0 ||
            !$('csb-region').value || !$('csb-district').value) {
            formStatus.textContent = 'Vérifiez le port, le nom, la région, le district et la distance.';
            return;
        }
        const requestGeneration = sessionGeneration;
        csbSaving = true;
        markFormLocked('form-csb');
        for (const control of $('form-csb').querySelectorAll('input, select, textarea, button')) control.disabled = true;
        $('csb-close').disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_save_csb', {
                csb_id: csbEditing, selected_port: csbPort, csb_name: name,
                csb_region: $('csb-region').value, csb_district: $('csb-district').value, csb_distance: distance,
                csb_chief: $('csb-chief').value.trim(), csb_phones: $('csb-phones').value.split(/\r?\n/).map(x => x.trim()).filter(Boolean)
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            csbSaving = false;
            closeCsb();
            if (frameConnected) sendFrame({ type: 'qbox-csb-changed', port: portSelect.value });
            await refreshCsbs();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-csb-status').textContent += ' CSB enregistré.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) formStatus.textContent = `${error.message} Actualisez les CSB après une interruption avant de recommencer.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('form-csb');
                csbSaving = false;
                for (const control of $('form-csb').querySelectorAll('input, select, textarea, button')) control.disabled = false;
                $('csb-close').disabled = false;
            }
        }
    }

    async function deleteCsb(csb, port) {
        if (!hasRole(['admin', 'pilot', 'logistics']) || csbSaving ||
            port !== portSelect.value || !confirm(`Supprimer le CSB « ${csb.name} » ?`)) return;
        const requestGeneration = sessionGeneration;
        csbSaving = true;
        try {
            await api('/rest/v1/rpc/qbox_delete_csb', { selected_port: port, csb_id: csb.id }, true);
            if (sessionGeneration !== requestGeneration || activeView !== 'csb' || port !== portSelect.value) return;
            if (frameConnected) sendFrame({ type: 'qbox-csb-changed', port });
            await refreshCsbs();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-csb-status').textContent += ' CSB supprimé.';
        } catch (error) {
            if (sessionGeneration === requestGeneration && activeView === 'csb' && port === portSelect.value)
                $('postgres-csb-status').textContent = `${error.message} Actualisez les CSB pour vérifier le résultat.`;
        } finally { if (sessionGeneration === requestGeneration) csbSaving = false; }
    }

    async function refreshPorts() {
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        const previous = portSelect.value;
        const body = $('ports-table-body');
        body.replaceChildren();
        $('postgres-ports-status').textContent = 'Chargement…';
        try {
            const ports = await api('/rest/v1/rpc/qbox_list_warehouses', {}, true);
            if (seq !== requestSequence || activeView !== 'ports' || sessionGeneration !== requestGeneration) return;
            warehouseRows = ports;
            portSelect.replaceChildren();
            for (const port of ports) {
                portSelect.add(new Option(`${port.name} · ${port.region}`, port.id));
                const row = tableRow([port.code, `${port.name} · ${port.site_type === 'storage' ? 'Magasin de stockage' : 'Drone port'}`, port.region]);
                row.children[0].className += ' font-mono font-bold';
                row.children[1].className += ' font-bold text-slate-900';
                const actions = document.createElement('td');
                actions.className = 'py-3 px-4 text-right';
                if (userRole === 'admin') {
                    for (const [label, action] of [['Modifier', () => openPort(port)], ['Supprimer', () => deletePort(port)]]) {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = `px-2 py-1 ml-2 rounded-lg text-xs font-bold ${label === 'Supprimer' ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`;
                        button.textContent = label;
                        button.addEventListener('click', action);
                        actions.append(button);
                    }
                } else actions.textContent = 'Lecture seule';
                row.append(actions);
                body.append(row);
            }
            if (ports.some(port => port.id === previous)) portSelect.value = previous;
            if (!ports.length) body.append(emptyTableRow('Aucun magasin.', 4));
            updateSiteNavigation();
            setText('active-port-badge', portSelect.selectedOptions[0]?.textContent || 'Aucun port');
            $('postgres-ports-status').textContent = `${ports.length} port(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (seq === requestSequence && activeView === 'ports' && sessionGeneration === requestGeneration)
                $('postgres-ports-status').textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    async function openPort(port = null) {
        if (userRole !== 'admin') {
            $('postgres-ports-status').textContent = 'Seul un administrateur peut modifier les magasins.';
            return;
        }
        if (portLoading || portSaving) return;
        const requestGeneration = sessionGeneration;
        portLoading = true;
        try {
            const regions = await api('/rest/v1/rpc/qbox_geography', {}, true);
            if (sessionGeneration !== requestGeneration || activeView !== 'ports') return;
            if (!regions.length) throw new Error('Régions indisponibles.');
            portFormOpen = true;
            portEditing = port?.id || null;
            $('port-form').reset();
            $('port-name').value = port?.name || '';
            $('port-type').value = port?.site_type || 'drone_port';
            $('port-type').disabled = !!port;
            $('port-region').replaceChildren();
            for (const region of new Set(regions.map(item => item.region))) $('port-region').add(new Option(region, region));
            if (port) $('port-region').value = port.region;
            $('port-form-title').textContent = port ? 'Modifier le magasin' : 'Ajouter un magasin';
            $('postgres-ports-status').textContent = '';
            $('port-form').classList.remove('hidden');
            portSelect.disabled = true;
        } catch (error) {
            if (sessionGeneration === requestGeneration && activeView === 'ports') $('postgres-ports-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) portLoading = false; }
    }

    function closePort() {
        if (portSaving) return;
        portFormOpen = false;
        portEditing = null;
        $('port-form').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitPort(event) {
        event.preventDefault();
        if (!portFormOpen || portSaving || userRole !== 'admin') return;
        const name = $('port-name').value.trim();
        const region = $('port-region').value;
        if (!name || !region) {
            $('postgres-ports-status').textContent = 'Indiquez le nom et la région du magasin.';
            return;
        }
        const requestGeneration = sessionGeneration;
        portSaving = true;
        markFormLocked('port-form');
        for (const control of $('port-form').querySelectorAll('input, select, button')) control.disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_save_warehouse', { port_id: portEditing, port_name: name, port_region: region, warehouse_type: $('port-type').value }, true);
            if (sessionGeneration !== requestGeneration) return;
            portSaving = false;
            closePort();
            await refreshPorts();
            if (sessionGeneration !== requestGeneration) return;
            if (frameConnected) sendFrame({ type: 'qbox-ports-changed', port: portSelect.value });
            $('postgres-ports-status').textContent += ' Port enregistré.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-ports-status').textContent = `${error.message} Actualisez les ports après une interruption avant de recommencer.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('port-form');
                portSaving = false;
                for (const control of $('port-form').querySelectorAll('input, select, button')) control.disabled = false;
                $('port-type').disabled = !!portEditing;
            }
        }
    }

    async function deletePort(port) {
        if (frameConnected && port.id === portSelect.value) {
            $('postgres-ports-status').textContent = 'Pour supprimer le port actif, rechargez Q.box après avoir terminé les saisies du panneau, puis réessayez.';
            return;
        }
        if (userRole !== 'admin' || portSaving || !confirm(`Supprimer le magasin « ${port.name} » ?`)) return;
        const requestGeneration = sessionGeneration;
        portSaving = true;
        try {
            await api('/rest/v1/rpc/qbox_delete_port', { port_id: port.id }, true);
            if (sessionGeneration !== requestGeneration || activeView !== 'ports') return;
            await refreshPorts();
            if (sessionGeneration !== requestGeneration) return;
            if (frameConnected) sendFrame({ type: 'qbox-ports-changed', port: portSelect.value });
            $('postgres-ports-status').textContent += ' Port supprimé.';
        } catch (error) {
            if (sessionGeneration === requestGeneration && activeView === 'ports')
                $('postgres-ports-status').textContent = `${error.message} Actualisez les ports pour vérifier le résultat.`;
        } finally { if (sessionGeneration === requestGeneration) portSaving = false; }
    }

    function transferDestinationChanged() {
        const external = $('transfer-destination').value === 'external';
        $('transfer-external-field').classList.toggle('hidden', !external);
        $('transfer-external').required = external;
    }

    function addTransferItem() {
        const row = document.createElement('div');
        row.className = 'transfer-item grid grid-cols-1 lg:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl';
        const stock = document.createElement('select');
        stock.name = 'stock';
        stock.required = true;
        stock.className = 'text-xs p-2 rounded-lg border border-slate-200 bg-white';
        stock.setAttribute('aria-label', 'Intrant et lot');
        stock.add(new Option('Sélectionner un lot', ''));
        for (const lot of transferStocks.filter(item => BigInt(item.available) > 0n))
            stock.add(new Option(`${lot.name} · ${lot.lot} · disponible ${number(lot.available)}`, lot.id));
        const quantity = document.createElement('input');
        quantity.name = 'quantity';
        quantity.type = 'number';
        quantity.min = '1';
        quantity.max = '9007199254740991';
        quantity.step = '1';
        quantity.required = true;
        quantity.placeholder = 'Quantité';
        quantity.setAttribute('aria-label', 'Quantité');
        quantity.className = 'text-xs p-2 rounded-lg border border-slate-200';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Retirer';
        remove.className = 'text-xs font-bold text-rose-700';
        remove.addEventListener('click', () => row.remove());
        row.append(stock, quantity, remove);
        $('transfer-items').append(row);
    }

    function renderTransferCard(transfer, port) {
        const external = !transfer.destination_port;
        const incoming = transfer.destination_port === port;
        const card = document.createElement('article');
        card.className = 'transfer-history-card';
        const header = document.createElement('div');
        header.className = 'transfer-history-card-header';
        const identity = document.createElement('div');
        identity.className = 'transfer-history-identity';
        const reference = document.createElement('h5');
        reference.className = 'transfer-history-reference';
        reference.textContent = transfer.reference;
        const date = document.createElement('p');
        date.className = 'transfer-history-date';
        date.textContent = `${localDateTime(transfer.created_at)} · heure de Madagascar`;
        identity.append(reference, date);
        const direction = document.createElement('span');
        direction.className = `transfer-history-badge ${incoming ? 'transfer-history-badge-incoming' : 'transfer-history-badge-outgoing'}`;
        direction.textContent = external ? 'Expédition externe' : incoming ? 'Transfert entrant' : 'Transfert sortant';
        header.append(identity, direction);

        const route = document.createElement('dl');
        route.className = 'transfer-history-route';
        for (const [label, value] of [['Départ', transfer.source_name], ['Destination', transfer.destination_name], ['Transport', transfer.transport]]) {
            const field = document.createElement('div');
            const term = document.createElement('dt');
            const description = document.createElement('dd');
            term.textContent = label;
            description.textContent = value;
            field.append(term, description);
            route.append(field);
        }

        const items = document.createElement('div');
        items.className = 'transfer-history-items';
        const heading = document.createElement('h6');
        heading.textContent = 'Intrants et lots';
        items.append(heading);
        if (transfer.items?.length) {
            const list = document.createElement('ul');
            list.className = 'transfer-history-item-list';
            for (const item of transfer.items) {
                const row = document.createElement('li');
                const product = document.createElement('span');
                product.className = 'transfer-history-product';
                product.textContent = item.product_name || item.name;
                const lot = document.createElement('span');
                lot.className = 'transfer-history-lot';
                lot.textContent = `Lot ${item.lot}`;
                const quantity = document.createElement('span');
                quantity.className = 'transfer-history-quantity';
                quantity.textContent = `Quantité : ${number(item.quantity)}`;
                row.append(product, lot, quantity);
                list.append(row);
            }
            items.append(list);
        } else {
            const empty = document.createElement('p');
            empty.className = 'transfer-history-no-items';
            empty.textContent = 'Aucun détail disponible.';
            items.append(empty);
        }
        card.append(header, route, items);
        return card;
    }

    async function refreshTransfers() {
        const port = portSelect.value, sequence = ++requestSequence, requestGeneration = sessionGeneration;
        transferRequestId = null;
        $('transfer-form').reset();
        $('transfer-form').classList.add('postgres-hidden');
        $('transfer-items').replaceChildren();
        $('transfer-list').replaceChildren();
        $('transfer-status').textContent = 'Chargement…';
        if (!port) {
            $('transfer-status').textContent = 'Sélectionnez un magasin.';
            return;
        }
        try {
            const [stocks, transfers] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_stock_transfers', {selected_port:port}, true)
            ]);
            if (sequence !== requestSequence || sessionGeneration !== requestGeneration || activeView !== 'transfers' || port !== portSelect.value) return;
            transferStocks = stocks;
            $('transfer-destination').replaceChildren();
            $('transfer-destination').add(new Option('Sélectionner une destination', ''));
            const source = warehouseRows.find(site => site.id === port);
            for (const site of warehouseRows.filter(site => site.id !== port && site.site_type !== source?.site_type))
                $('transfer-destination').add(new Option(`${site.name} · ${site.region}`, site.id));
            if (isStorage()) $('transfer-destination').add(new Option('Destinataire externe', 'external'));
            transferDestinationChanged();
            addTransferItem();
            for (const transfer of transfers) $('transfer-list').append(renderTransferCard(transfer, port));
            if (!transfers.length) {
                const empty = document.createElement('p');
                empty.className = 'transfer-history-empty';
                empty.textContent = 'Aucune opération enregistrée pour ce magasin.';
                $('transfer-list').append(empty);
            }
            $('transfer-form').classList.toggle('postgres-hidden', !hasRole(['admin', 'logistics']));
            $('transfer-status').textContent = `${transfers.length} opération(s). Les transferts sont enregistrés comme reçus immédiatement.`;
            return true;
        } catch (error) {
            if (sequence === requestSequence && sessionGeneration === requestGeneration && activeView === 'transfers' && port === portSelect.value) {
                $('transfer-form').classList.add('postgres-hidden');
                $('transfer-status').textContent = `Chargement impossible : ${error.message}`;
            }
            return false;
        }
    }

    async function submitTransfer(event) {
        event.preventDefault();
        if (transferSaving || !hasRole(['admin', 'logistics'])) return;
        const port = portSelect.value;
        const destination = $('transfer-destination').value;
        const external = destination === 'external';
        const transport = $('transfer-transport').value.trim();
        const recipient = $('transfer-external').value.trim();
        const items = [];
        for (const row of $('transfer-items').querySelectorAll('.transfer-item')) {
            const stockId = row.querySelector('[name=stock]').value;
            const quantity = Number(row.querySelector('[name=quantity]').value);
            if (!stockId || !Number.isSafeInteger(quantity) || quantity <= 0 || items.some(item => item.stock_id === stockId)) {
                $('transfer-status').textContent = 'Sélectionnez des lots distincts et des quantités entières positives.';
                return;
            }
            items.push({stock_id:stockId, quantity});
        }
        if (!destination || !transport || (external && !recipient) || !items.length) {
            $('transfer-status').textContent = 'Renseignez la destination, le transport et au moins un lot.';
            return;
        }
        if (!confirm('Confirmer cette expédition ? Les stocks seront modifiés immédiatement.')) return;
        const requestGeneration = sessionGeneration;
        transferRequestId = transferRequestId || crypto.randomUUID();
        transferSaving = true;
        portSelect.disabled = true;
        markFormLocked('transfer-form');
        for (const control of $('transfer-form').querySelectorAll('input, select, button')) control.disabled = true;
        try {
            const ref = await api('/rest/v1/rpc/qbox_create_stock_transfer', {
                request_id:transferRequestId, source_port:port, destination_port:external ? null : destination,
                external_destination:external ? recipient : null, transport_name:transport, items
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            const refreshed = await refreshTransfers();
            if (sessionGeneration !== requestGeneration) return;
            if (refreshed) $('transfer-status').textContent = `Opération ${ref} enregistrée.`;
            else $('transfer-status').textContent = `Opération ${ref} enregistrée, mais ${$('transfer-status').textContent}`;
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('transfer-status').textContent = `${error.message} En cas d’interruption, actualisez la liste avant de recommencer.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('transfer-form');
                transferSaving = false;
                portSelect.disabled = false;
                for (const control of $('transfer-form').querySelectorAll('input, select, button')) control.disabled = false;
            }
        }
    }

    function roundedProgress(quantity, total) {
        if (total <= 0n) return null;
        const rounded = (quantity * 100n + total / 2n) / total;
        return quantity < total && rounded >= 100n ? 99n : rounded;
    }

    function planningProgress(planned, delivered, inFlight, inTransit, label) {
        const total = BigInt(planned);
        const quantities = [BigInt(delivered), BigInt(inFlight), BigInt(inTransit)];
        const effective = quantities.reduce((sum, value) => sum + value, 0n);
        const percent = roundedProgress(effective, total);
        const track = document.createElement('div');
        track.className = 'w-full bg-slate-200 rounded-full h-2 overflow-hidden flex';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', label);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        if (percent !== null) track.setAttribute('aria-valuenow', String(percent > 100n ? 100n : percent));
        let available = total;
        for (const [index, color, name] of [[0, 'bg-emerald-500', 'Livré'], [1, 'bg-cyan-400', 'En vol'], [2, 'bg-sky-600', 'Transit terrestre']]) {
            const amount = quantities[index] < available ? quantities[index] : available;
            available -= amount;
            const segment = document.createElement('div');
            segment.className = `${color} h-2`;
            segment.style.width = total > 0n ? `${Number(amount * 10000n / total) / 100}%` : '0%';
            segment.title = `${name} : ${number(quantities[index])}`;
            track.append(segment);
        }
        return { track, effective, percent };
    }

    function appendPlanningHistory(card, view, id, port) {
        const section = document.createElement('div');
        section.className = 'p-4 border-t border-slate-100 text-xs text-slate-700';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'font-bold text-sky-700';
        button.textContent = 'Afficher l’historique des modifications';
        const content = document.createElement('div');
        content.setAttribute('aria-live', 'polite');
        button.addEventListener('click', async () => {
            const sequence = requestSequence, requestGeneration = sessionGeneration;
            if (button.disabled || port !== portSelect.value || view !== activeView) return;
            button.disabled = true;
            content.textContent = 'Chargement de l’historique…';
            try {
                const changes = await api('/rest/v1/rpc/qbox_planning_history', {selected_port:port, selected_planning:id}, true);
                if (sequence !== requestSequence || sessionGeneration !== requestGeneration || view !== activeView || port !== portSelect.value) return;
                renderPlanningHistoryEntries(content, changes);
            } catch (error) {
                if (sequence === requestSequence && sessionGeneration === requestGeneration && view === activeView && port === portSelect.value)
                    content.textContent = `Impossible de charger l’historique : ${error.message}`;
            } finally { button.disabled = false; }
        });
        section.append(button, content);
        card.append(section);
    }

    async function refreshPlanCards(view) {
            const port = portSelect.value;
            const seq = ++requestSequence;
            const requestGeneration = sessionGeneration;
            const container = $(view === 'planning' ? 'planning-cards-container' : 'archives-container');
            const notice = $(`postgres-${view}-status`);
            container.replaceChildren();
            notice.textContent = port ? 'Chargement…' : 'Aucun port disponible.';
            if (!port) return;
            try {
                const result = await api('/rest/v1/rpc/qbox_list_plannings', { selected_port: port }, true);
                if (seq !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
                const plans = result.filter(plan => plan.status === (view === 'planning' ? 'En cours' : 'Archivé'));
                if (!plans.length) {
                    const empty = document.createElement('div');
                    empty.className = 'p-8 text-center text-slate-400 text-xs italic';
                    empty.textContent = view === 'planning' ? 'Aucun planning prévisionnel actif pour ce drone port.' : 'Aucun planning archivé.';
                    container.append(empty);
                }
                for (const plan of plans) {
                    const card = document.createElement('article');
                    card.className = 'border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm hover:border-slate-300 transition-all';
                    const grouped = new Map();
                    const totals = {planned: 0n, delivered: 0n, in_flight: 0n, in_transit: 0n};
                    for (const item of plan.items) {
                        if (!grouped.has(item.csb_id)) grouped.set(item.csb_id, { name: item.csb_name, items: [] });
                        grouped.get(item.csb_id).items.push(item);
                        for (const key of Object.keys(totals)) totals[key] += BigInt(item[key]);
                    }
                    const progress = planningProgress(totals.planned, totals.delivered, totals.in_flight, totals.in_transit, `Avancement de ${plan.code}`);
                    const header = document.createElement('div');
                    header.className = 'p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
                    const heading = document.createElement('div');
                    heading.className = 'space-y-1';
                    const title = document.createElement('h3');
                    title.className = 'font-bold text-slate-900 text-sm';
                    title.textContent = `Campagne du ${plan.start_date} au ${plan.end_date}`;
                    const subtitle = document.createElement('p');
                    subtitle.className = 'text-xs text-slate-500';
                    subtitle.textContent = `${plan.code} · ${grouped.size} CSB concerné(s)${plan.folder ? ` · ${plan.folder}` : ''}`;
                    heading.append(title, subtitle);
                    const summary = document.createElement('div');
                    summary.className = 'flex flex-wrap items-center gap-3';
                    const ratio = document.createElement('div');
                    ratio.className = 'text-xs font-mono font-bold text-slate-800';
                    ratio.textContent = `${number(progress.effective)} / ${number(totals.planned)} un. (${progress.percent === null ? 'N/A' : `${number(progress.percent)}%`})`;
                    summary.append(ratio);
                    if (view === 'planning' && hasRole(['admin', 'logistics'])) {
                        const edit = document.createElement('button');
                        edit.type = 'button';
                        edit.className = 'px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700';
                        edit.textContent = 'Modifier la campagne';
                        edit.addEventListener('click', () => openPlanning(plan.id));
                        summary.append(edit);
                    }
                    header.append(heading, summary);
                    card.append(header);
                    const progressArea = document.createElement('div');
                    progressArea.className = 'px-4 py-3 bg-white border-b border-slate-100';
                    const legend = document.createElement('p');
                    legend.className = 'mt-2 text-[10px] text-slate-500';
                    legend.textContent = `Livré : ${number(totals.delivered)} · En vol : ${number(totals.in_flight)} · Transit terrestre : ${number(totals.in_transit)} · Totaux tous intrants confondus`;
                    progressArea.append(progress.track, legend);
                    card.append(progressArea);
                    for (const [csbId, group] of grouped) {
                        const section = document.createElement('div');
                        section.className = 'p-4 bg-slate-50/30 border-t border-slate-100';
                        const groupHeader = document.createElement('div');
                        groupHeader.className = 'flex flex-wrap items-center justify-between gap-2 mb-2';
                        const title = document.createElement('h4');
                        title.className = 'text-xs font-bold text-slate-800';
                        title.textContent = group.name;
                        const print = document.createElement('button');
                        print.type = 'button';
                        print.className = 'px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded shadow-sm';
                        print.textContent = 'Aperçu des besoins';
                        print.addEventListener('click', () => openPlanningPrint(view, plan.id, csbId));
                        groupHeader.append(title, print);
                        const scroll = document.createElement('div');
                        scroll.className = 'overflow-x-auto';
                        const table = document.createElement('table');
                        table.className = 'w-full text-left border-collapse text-xs';
                        const head = document.createElement('thead');
                        const headers = document.createElement('tr');
                        headers.className = 'text-slate-400 text-[10px] uppercase border-b border-slate-100';
                        for (const text of ['Intrant médical', 'Besoin prévu', 'Livré et en transit', 'Restant à prévoir', 'Progression globale']) {
                            const th = document.createElement('th');
                            th.scope = 'col';
                            th.className = 'py-1.5 px-2 font-semibold';
                            th.textContent = text;
                            headers.append(th);
                        }
                        head.append(headers);
                        const body = document.createElement('tbody');
                        body.className = 'divide-y divide-slate-100';
                        for (const item of group.items) {
                            const row = document.createElement('tr');
                            row.className = 'hover:bg-slate-100/50';
                            for (const text of [item.product_name, number(item.planned),
                                `Livré : ${number(item.delivered)} · En vol : ${number(item.in_flight)} · Transit terrestre : ${number(item.in_transit)}`,
                                number(item.remaining)]) {
                                const cell = document.createElement('td');
                                cell.className = 'py-2 px-2 text-slate-700';
                                cell.textContent = text;
                                row.append(cell);
                            }
                            const progressCell = document.createElement('td');
                            progressCell.className = 'py-2 px-2 min-w-[150px]';
                            const itemProgress = planningProgress(item.planned, item.delivered, item.in_flight, item.in_transit, `Avancement de ${item.product_name} pour ${group.name}`);
                            const rate = document.createElement('span');
                            rate.className = 'text-[10px] font-mono text-slate-500';
                            rate.textContent = itemProgress.percent === null ? 'N/A' : `${number(itemProgress.percent)}%`;
                            progressCell.append(itemProgress.track, rate);
                            row.append(progressCell);
                            body.append(row);
                        }
                        table.append(head, body);
                        scroll.append(table);
                        section.append(groupHeader, scroll);
                        card.append(section);
                    }
                    appendPlanningHistory(card, view, plan.id, port);
                    container.append(card);
                }
                notice.textContent = `${plans.length} planning(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
            } catch (error) {
                if (seq === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                    notice.textContent = `Lecture indisponible : ${error.message}`;
            }
    }

    async function readPlanningPrint(port, planId, csbId) {
        const [plans, ports] = await Promise.all([
            api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true),
            api('/rest/v1/rpc/qbox_list_ports', {}, true)
        ]);
        const plan = plans.find(item => item.id === planId);
        const selectedPort = ports.find(item => item.id === port);
        const items = plan ? plan.items.filter(item => item.csb_id === csbId) : [];
        if (!plan || !selectedPort || !items.length) throw new Error('Besoins ou port introuvables : actualisez la liste.');
        return {plan, port:selectedPort, items};
    }

    function renderPlanningPrint({plan, port, items}) {
        const report = $('planning-print-content');
        report.replaceChildren();
        for (const [tag, value] of [
            ['h1', `Besoins prévisionnels · ${plan.code}`],
            ['p', `Port : ${port.name} · ${port.region} · CSB : ${items[0].csb_name}`],
            ['p', `Période : ${plan.start_date} au ${plan.end_date} · Statut : ${plan.status}`],
            ['p', 'Le restant à prévoir exclut les quantités livrées, en vol et en transit terrestre.']
        ]) {
            const node = document.createElement(tag);
            node.textContent = value;
            report.append(node);
        }
        const table = document.createElement('table');
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        for (const value of ['Intrant', 'Prévu', 'Livré', 'En vol', 'Transit terrestre', 'Restant à prévoir']) {
            const cell = document.createElement('th');
            cell.textContent = value;
            header.append(cell);
        }
        head.append(header);
        const body = document.createElement('tbody');
        for (const item of items) {
            const row = document.createElement('tr');
            for (const value of [item.product_name, ...['planned', 'delivered', 'in_flight', 'in_transit', 'remaining'].map(key => number(item[key]))]) {
                const cell = document.createElement('td');
                cell.textContent = value;
                row.append(cell);
            }
            body.append(row);
        }
        table.append(head, body);
        report.append(table);
    }

    async function openPlanningPrint(view, planId, csbId) {
        if (planningPrintDraft || activeView !== view || !portSelect.value) return;
        const port = portSelect.value, sequence = ++planningPrintSequence, request = requestSequence, requestGeneration = sessionGeneration;
        $(`postgres-${view}-status`).textContent = 'Chargement des besoins…';
        try {
            const data = await readPlanningPrint(port, planId, csbId);
            if (sequence !== planningPrintSequence || request !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            renderPlanningPrint(data);
            planningPrintDraft = {view, port, planId, csbId};
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('planning-print-modal').classList.remove('hidden');
            $(`postgres-${view}-status`).textContent = 'Aperçu chargé.';
        } catch (error) {
            if (sequence === planningPrintSequence && request === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                $(`postgres-${view}-status`).textContent = `Impossible d’ouvrir les besoins : ${error.message}`;
        }
    }

    function closePlanningPrint() {
        planningPrintSequence++;
        planningPrintDraft = null;
        $('planning-print-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('planning-print-content').replaceChildren();
        document.body.classList.remove('postgres-planning-print');
        portSelect.disabled = false;
    }

    async function printPlanningNeeds() {
        const draft = planningPrintDraft;
        if (!draft || draft.port !== portSelect.value) return;
        const sequence = ++planningPrintSequence, requestGeneration = sessionGeneration;
        $('planning-print-button').disabled = true;
        try {
            const data = await readPlanningPrint(draft.port, draft.planId, draft.csbId);
            if (sequence !== planningPrintSequence || planningPrintDraft !== draft || sessionGeneration !== requestGeneration || draft.port !== portSelect.value) return;
            renderPlanningPrint(data);
            document.body.classList.add('postgres-planning-print');
            window.print();
        } catch (error) {
            if (sequence === planningPrintSequence && sessionGeneration === requestGeneration) {
                closePlanningPrint();
                $(`postgres-${draft.view}-status`).textContent = `Impossible d’imprimer les besoins : ${error.message}`;
            }
        } finally { if (sessionGeneration === requestGeneration) $('planning-print-button').disabled = false; }
    }

    function appendDeliveryHistory(container, view, id, buttonClass = 'ml-3 text-xs font-bold text-sky-700') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = buttonClass;
        button.textContent = 'Historique des modifications';
        const history = document.createElement('div');
        history.className = 'mt-2 text-left text-xs text-slate-700';
        button.addEventListener('click', async () => {
            const port = portSelect.value, sequence = requestSequence, requestGeneration = sessionGeneration;
            if (!port || activeView !== view || button.disabled) return;
            button.disabled = true;
            history.textContent = 'Chargement de l’historique…';
            try {
                const flight = view !== 'sorties';
                const [detail, stocks] = await Promise.all([
                    api(`/rest/v1/rpc/qbox_${flight ? 'flight' : 'shipment'}_details`, {
                        selected_port:port, [flight ? 'selected_flight' : 'selected_shipment']:id
                    }, true),
                    api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true)
                ]);
                if (sequence !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
                history.replaceChildren();
                if (!detail.changes.length) addLine(history, 'Aucune modification enregistrée.');
                const describe = items => items.map(item => {
                    const lot = stocks.find(stock => stock.id === item.stock_id);
                    return `${lot ? `${lot.name} · Lot ${lot.lot}` : item.stock_id} : ${number(item.quantity)}`;
                }).join(' ; ') || 'aucun';
                for (const change of detail.changes) {
                    const transport = flight ? '' : ` · Transport : ${change.before_transport} → ${change.after_transport}`;
                    const returned = !flight && change.return_confirmed ? ' · Retour physique et conformité confirmés' : '';
                    addLine(history, `${change.action} · Version ${change.version} · ${localDateTime(change.performed_at)} (Madagascar) · ${change.performed_by_name || 'Nom non renseigné'}${transport} · Avant : ${describe(change.before_items)} · Après : ${describe(change.after_items)}${returned}`);
                }
            } catch (error) {
                if (sequence === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                    history.textContent = `Impossible de charger l’historique : ${error.message}`;
            } finally { button.disabled = false; }
        });
        container.append(button, history);
    }

    async function refreshDeliveries(view) {
        const port = portSelect.value, sequence = ++requestSequence, requestGeneration = sessionGeneration;
        const container = $(view === 'drones' ? 'drones-groups' : view === 'history' ? 'history-table-body' : 'sorties-table-body');
        const message = $(`postgres-${view}-status`);
        container.replaceChildren();
        message.textContent = port ? 'Chargement…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const name = view === 'sorties' ? 'qbox_list_shipments' : 'qbox_list_flights';
            const data = await api(`/rest/v1/rpc/${name}`, { selected_port: port }, true);
            if (sequence !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const rows = view === 'sorties' ? data : data.filter(flight => view === 'drones' ? flight.status === 'En vol' : flight.status !== 'En vol');
            if (view === 'drones') {
                if (!rows.length) {
                    const empty = document.createElement('div');
                    empty.className = 'p-6 text-center text-slate-400 italic text-xs';
                    empty.textContent = 'Aucune rotation drone en cours.';
                    container.append(empty);
                }
                const groups = new Map();
                for (const flight of rows) {
                    if (!groups.has(flight.csb_id)) groups.set(flight.csb_id, { name: flight.csb_name, flights: [] });
                    groups.get(flight.csb_id).flights.push(flight);
                }
                for (const group of groups.values()) {
                    const section = document.createElement('article');
                    section.className = 'border border-slate-200 rounded-2xl overflow-hidden bg-white';
                    const header = document.createElement('div');
                    header.className = 'px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2';
                    const title = document.createElement('h3');
                    title.className = 'text-sm font-bold text-slate-900';
                    title.textContent = group.name;
                    const badges = document.createElement('div');
                    badges.className = 'flex flex-wrap items-center gap-2 text-[10px] font-bold';
                    for (const code of new Set(group.flights.map(flight => flight.planning_code).filter(Boolean))) {
                        const badge = document.createElement('span');
                        badge.className = 'px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full';
                        badge.textContent = `Planning ${code}`;
                        badges.append(badge);
                    }
                    const count = document.createElement('span');
                    count.className = 'px-2 py-0.5 bg-slate-900 text-white rounded-full';
                    count.textContent = `${group.flights.length} colis`;
                    badges.append(count);
                    header.append(title, badges);
                    section.append(header);
                    for (const flight of group.flights) {
                        const card = document.createElement('div');
                        card.className = 'flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 border-t border-slate-100';
                        const reference = document.createElement('div');
                        reference.className = 'md:w-40 shrink-0';
                        const refLabel = document.createElement('div');
                        refLabel.className = 'text-[10px] uppercase tracking-wider text-slate-400 font-semibold';
                        refLabel.textContent = 'N° BL';
                        const refValue = document.createElement('div');
                        refValue.className = 'font-mono font-bold text-slate-900 text-xs';
                        refValue.textContent = flight.bl;
                        const departed = document.createElement('div');
                        departed.className = 'text-[10px] text-slate-500 mt-1';
                        departed.textContent = `Départ : ${localDateTime(flight.departed_at)} (Madagascar)`;
                        reference.append(refLabel, refValue, departed);
                        const payload = document.createElement('div');
                        payload.className = 'flex-1 font-mono text-slate-700 text-xs space-y-0.5';
                        for (const item of flight.items) addLine(payload, `${number(item.quantity)} · ${item.product_name || item.name} (Lot : ${item.lot})`);
                        if (!flight.items.length) addLine(payload, 'Aucun détail');
                        const state = document.createElement('span');
                        state.className = 'px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-full text-[10px] font-bold w-max shrink-0';
                        state.textContent = 'En cours de livraison';
                        const actions = document.createElement('div');
                        actions.className = 'flex flex-wrap items-center gap-2 shrink-0';
                        if (hasRole(['admin', 'pilot'])) {
                            const close = document.createElement('button');
                            close.type = 'button';
                            close.className = 'px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold';
                            close.textContent = 'Clôturer ce vol';
                            close.addEventListener('click', () => openDeliveryClose('drones', flight.id));
                            actions.append(close);
                            const cancel = document.createElement('button');
                            cancel.type = 'button';
                            cancel.className = 'px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold';
                            cancel.textContent = 'Annuler ce vol';
                            cancel.addEventListener('click', () => openDeliveryClose('drones', flight.id, 'cancel'));
                            actions.append(cancel);
                            const edit = document.createElement('button');
                            edit.type = 'button';
                            edit.className = 'px-3 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 text-sky-700 rounded-lg text-xs font-bold';
                            edit.textContent = 'Modifier ce vol';
                            edit.addEventListener('click', () => openDeliveryEdit('drones', flight.id));
                            actions.append(edit);
                        }
                        const print = document.createElement('button');
                        print.type = 'button';
                        print.className = 'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold';
                        print.textContent = 'Aperçu du BL';
                        print.addEventListener('click', () => openDeliveryPrint('drones', flight.id));
                        actions.append(print);
                        const history = document.createElement('div');
                        history.className = 'px-4 pb-3 text-xs text-slate-600';
                        appendDeliveryHistory(history, view, flight.id);
                        card.append(reference, payload, state, actions);
                        section.append(card);
                        section.append(history);
                    }
                    container.append(section);
                }
            } else {
                for (const entry of rows) {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50 transition-colors';
                    const values = view === 'history'
                        ? [entry.bl, entry.closed_date || 'Non renseignée', entry.csb_name, cargo(entry.items), entry.status]
                        : [entry.reference, localDateTime(entry.dispatched_at), entry.csb_name, entry.transport, cargo(entry.items), entry.status];
                    for (const value of values) {
                        const cell = document.createElement('td');
                        cell.className = 'py-3 px-4 text-slate-700';
                        cell.textContent = value;
                        tr.append(cell);
                    }
                    tr.children[0].className += ' font-mono font-bold';
                    tr.children[2].className += ' font-bold text-slate-900';
                    const cell = document.createElement('td');
                    cell.className = 'py-3 px-4 text-right';
                    const actions = document.createElement('div');
                    actions.className = 'flex flex-wrap justify-end items-center gap-2';
                    if (view === 'sorties' && entry.status === 'En cours' && hasRole(['admin', 'logistics'])) {
                        const close = document.createElement('button');
                        close.type = 'button';
                        close.className = 'px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold';
                        close.textContent = 'Clôturer';
                        close.addEventListener('click', () => openDeliveryClose('sorties', entry.id));
                        actions.append(close);
                        const cancel = document.createElement('button');
                        cancel.type = 'button';
                        cancel.className = 'px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold';
                        cancel.textContent = 'Annuler';
                        cancel.addEventListener('click', () => openDeliveryClose('sorties', entry.id, 'cancel'));
                        actions.append(cancel);
                        const edit = document.createElement('button');
                        edit.type = 'button';
                        edit.className = 'px-3 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 text-sky-700 rounded-lg text-xs font-bold';
                        edit.textContent = 'Modifier';
                        edit.addEventListener('click', () => openDeliveryEdit('sorties', entry.id));
                        actions.append(edit);
                    }
                    if (entry.status !== 'Annulé') {
                        const print = document.createElement('button');
                        print.type = 'button';
                        print.className = 'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold';
                        print.textContent = 'Aperçu du BL';
                        print.addEventListener('click', () => openDeliveryPrint(view, entry.id));
                        actions.append(print);
                    }
                    if (!['history', 'sorties'].includes(view) || userRole === 'admin') {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = 'px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold';
                        button.textContent = 'Opérations / BL';
                        button.addEventListener('click', () => openOperations(operationSections[view]));
                        actions.append(button);
                    }
                    cell.append(actions);
                    const history = document.createElement('div');
                    history.className = 'mt-2 text-right';
                    appendDeliveryHistory(history, view, entry.id, 'px-3 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 text-sky-700 rounded-lg text-xs font-bold');
                    cell.append(history);
                    tr.append(cell);
                    container.append(tr);
                }
                if (!rows.length) container.append(emptyTableRow(
                    view === 'sorties' ? 'Aucune expédition terrestre.' : 'Aucun vol dans l’historique.',
                    view === 'sorties' ? 7 : 6));
            }
            message.textContent = `${rows.length} ${view === 'sorties' ? 'expédition(s)' : 'vol(s)'} · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                message.textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    async function readDeliveryPrint(view, id, port) {
        const flight = view !== 'sorties';
        const [deliveries, ports, stocks, plannings, csbs] = await Promise.all([
            api(`/rest/v1/rpc/qbox_list_${flight ? 'flights' : 'shipments'}`, {selected_port:port}, true),
            api('/rest/v1/rpc/qbox_list_ports', {}, true),
            api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true),
            api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true),
            api('/rest/v1/rpc/qbox_list_csbs', {selected_port:port}, true)
        ]);
        const delivery = deliveries.find(item => item.id === id);
        const selectedPort = ports.find(item => item.id === port);
        if (!delivery || !selectedPort) throw new Error('Opération ou port introuvable : actualisez la liste.');
        if (![flight ? 'En vol' : 'En cours', 'Clôturé'].includes(delivery.status))
            throw new Error('Une opération annulée ou de statut inconnu ne peut pas produire un bon de livraison.');
        return {delivery, port:selectedPort, stocks, planning:plannings.find(item => item.id === delivery.planning_id),
            csb:csbs.find(item => item.id === delivery.csb_id), flight};
    }

    function renderDeliveryPrint(data) {
        const {delivery, port, stocks, planning, csb, flight} = data;
        setText('print-doc-title', 'BON DE LIVRAISON');
        setText('print-bl-number', flight ? delivery.bl : delivery.reference);
        setText('print-bl-date', `Date d'impression : ${new Date().toLocaleDateString('fr-FR', { timeZone: 'Indian/Antananarivo' })}`);
        setText('print-origin', port.name);
        setText('print-region', `Région : ${port.region}`);
        setText('print-operator', `Planning : ${delivery.planning_code}`);
        setText('print-planning-period', `Période du planning : ${planning ? `${planning.start_date} au ${planning.end_date}` : 'Non renseignée'}`);
        setText('print-dest', delivery.csb_name);
        setText('print-dest-area', `Région : ${csb?.region || 'Non renseignée'}`);
        setText('print-dest-region', `District sanitaire : ${csb?.district || 'Non renseigné'}`);
        setText('print-transport-mode', `Acheminement : ${flight ? 'Drone' : delivery.transport}`);
        setText('print-th-col3', 'N° lot');
        setText('print-th-col4', 'Quantité');
        setText('print-th-article', 'Articles');
        $('print-th-expiry').hidden = false;
        $('print-article-count').hidden = false;
        $('print-footer-note').hidden = true;
        const body = $('print-items-body');
        body.replaceChildren();
        const articles = deliveryArticleRows(delivery.items, stocks);
        setText('print-article-count', `Arrêté au nombre de ${number(articles.count)} article(s).`);
        for (const item of articles.rows) {
            const row = document.createElement('tr');
            for (const value of [item.article, item.name, item.lot, item.expiry, number(item.quantity)]) {
                const cell = document.createElement('td');
                cell.className = 'py-2.5 px-3 border-r border-slate-300 text-slate-900';
                cell.textContent = value;
                row.append(cell);
            }
            body.append(row);
        }
    }

    async function openDeliveryPrint(view, id) {
        if (deliveryPrintDraft || activeView !== view || !portSelect.value) return;
        const port = portSelect.value, sequence = ++deliveryPrintSequence, requestGeneration = sessionGeneration, request = requestSequence;
        $(`postgres-${view}-status`).textContent = 'Chargement du bon de livraison…';
        try {
            const data = await readDeliveryPrint(view, id, port);
            if (sequence !== deliveryPrintSequence || request !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            renderDeliveryPrint(data);
            deliveryPrintDraft = {view, id, port};
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('print-preview-modal').classList.remove('hidden');
            $(`postgres-${view}-status`).textContent = 'Aperçu chargé.';
        } catch (error) {
            if (sequence === deliveryPrintSequence && request === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                $(`postgres-${view}-status`).textContent = `Impossible d’ouvrir le BL : ${error.message}`;
        }
    }

    function closeDeliveryPrint() {
        deliveryPrintSequence++;
        deliveryPrintDraft = null;
        $('print-preview-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('print-items-body').replaceChildren();
        document.body.classList.remove('postgres-bl-print');
        portSelect.disabled = false;
    }

    async function printDelivery() {
        const draft = deliveryPrintDraft;
        if (!draft || draft.port !== portSelect.value) return;
        const sequence = ++deliveryPrintSequence, requestGeneration = sessionGeneration;
        $('postgres-print-document').disabled = true;
        try {
            const data = await readDeliveryPrint(draft.view, draft.id, draft.port);
            if (sequence !== deliveryPrintSequence || deliveryPrintDraft !== draft || sessionGeneration !== requestGeneration || draft.port !== portSelect.value) return;
            renderDeliveryPrint(data);
            document.body.classList.add('postgres-bl-print');
            window.print();
        } catch (error) {
            if (sequence === deliveryPrintSequence && sessionGeneration === requestGeneration) {
                closeDeliveryPrint();
                $(`postgres-${draft.view}-status`).textContent = `Impossible d’imprimer le BL : ${error.message}`;
            }
        } finally { if (sessionGeneration === requestGeneration) $('postgres-print-document').disabled = false; }
    }

    function renderDeliveryNeeds(container, plan, csbId, quantities, original = new Map(), draftLabel = 'Ces colis', terrestrial = false) {
        container.replaceChildren();
        const needs = plan.items.filter(item => item.csb_id === csbId);
        if (!needs.length) {
            addLine(container, 'Aucun besoin pour ce CSB.');
            return;
        }
        const heading = document.createElement('p');
        heading.className = 'text-[11px] font-bold text-sky-900 mb-2';
        heading.textContent = `${plan.code} · Campagne du ${plan.start_date} au ${plan.end_date}`;
        container.append(heading);
        for (const item of needs) {
            const prepared = quantities.get(item.product_id) || 0n;
            const previous = original.get(item.product_id) || 0n;
            const remaining = BigInt(item.remaining) + previous - prepared;
            const card = document.createElement('div');
            card.className = `bg-white px-3 py-2 rounded-xl border ${remaining < 0n ? 'border-red-300' : 'border-sky-100'}`;
            const top = document.createElement('div');
            top.className = 'flex flex-wrap justify-between items-center gap-1';
            const name = document.createElement('span');
            name.className = 'font-semibold text-[11px] text-slate-800';
            name.textContent = item.product_name;
            const balance = document.createElement('span');
            balance.className = `font-mono text-[11px] font-bold ${remaining < 0n ? 'text-red-600' : remaining === 0n ? 'text-emerald-600' : 'text-slate-800'}`;
            balance.textContent = remaining < 0n ? `Dépassement : ${number(-remaining)}` : `Restant : ${number(remaining)}`;
            top.append(name, balance);
            const effectiveFlight = BigInt(item.in_flight) + (terrestrial ? 0n : prepared - previous);
            const effectiveTransit = BigInt(item.in_transit) + (terrestrial ? prepared - previous : 0n);
            const progress = planningProgress(item.planned, item.delivered,
                effectiveFlight > 0n ? effectiveFlight : 0n, effectiveTransit > 0n ? effectiveTransit : 0n, `Avancement de ${item.product_name}`);
            progress.track.className = 'w-full bg-slate-200 rounded-full h-2 overflow-hidden flex mt-1.5';
            const breakdown = document.createElement('p');
            breakdown.className = 'mt-1.5 font-mono text-[10px] text-slate-500';
            breakdown.textContent = `Prévu : ${number(item.planned)} · Livré : ${number(item.delivered)} · En vol : ${number(item.in_flight)} · Transit terrestre : ${number(item.in_transit)} · ${draftLabel} : ${number(prepared)}`;
            card.append(top, progress.track, breakdown);
            container.append(card);
        }
    }

    function updateDeliveryEditNeeds() {
        const draft = deliveryEditDraft;
        if (!draft) return;
        const quantities = new Map(), original = new Map();
        for (const item of draft.detail.items) {
            const lot = draft.stocks.find(stock => stock.id === item.stock_id);
            if (lot) original.set(lot.product_id, (original.get(lot.product_id) || 0n) + BigInt(item.quantity));
        }
        for (const row of $('delivery-edit-items').querySelectorAll('.delivery-edit-item')) {
            const lot = draft.stocks.find(stock => stock.id === row.querySelector('[name=stock]').value);
            const value = Number(row.querySelector('[name=quantity]').value);
            if (lot && Number.isSafeInteger(value) && value > 0)
                quantities.set(lot.product_id, (quantities.get(lot.product_id) || 0n) + BigInt(value));
        }
        renderDeliveryNeeds($('delivery-edit-needs'), draft.plan, draft.detail.csb_id, quantities, original,
            draft.view === 'drones' ? 'Ce colis' : 'Cette expédition', draft.view !== 'drones');
    }

    function addDeliveryEditItem(existing = null) {
        const draft = deliveryEditDraft;
        if (!draft) return;
        const row = document.createElement('div');
        row.className = 'delivery-edit-item grid grid-cols-12 gap-2 items-end p-2 bg-white border border-slate-200 rounded-xl';
        const stockLabel = document.createElement('label');
        stockLabel.className = 'col-span-12 sm:col-span-6 min-w-0 text-[10px] font-bold text-slate-600';
        stockLabel.textContent = 'Intrant et lot';
        const select = document.createElement('select');
        select.name = 'stock';
        select.required = true;
        select.className = 'mt-1 w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-400';
        const allowed = new Set(draft.plan.items.filter(item => item.csb_id === draft.detail.csb_id).map(item => item.product_id));
        for (const lot of draft.stocks.filter(item => allowed.has(item.product_id))) {
            const own = draft.detail.items.find(item => item.stock_id === lot.id);
            const available = BigInt(lot.available) + BigInt(own?.quantity || 0);
            if (available > 0n) select.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible : ${number(available)}`, lot.id));
        }
        if (!select.options.length) select.add(new Option('Aucun lot disponible', ''));
        if (existing) select.value = existing.stock_id;
        stockLabel.append(select);
        const quantityLabel = document.createElement('label');
        quantityLabel.className = 'col-span-7 sm:col-span-3 min-w-0 text-[10px] font-bold text-slate-600';
        quantityLabel.textContent = 'Quantité';
        const quantity = document.createElement('input');
        quantity.name = 'quantity';
        quantity.type = 'number';
        quantity.min = '1';
        quantity.max = '9007199254740991';
        quantity.step = '1';
        quantity.required = true;
        quantity.className = 'mt-1 w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-amber-400';
        if (existing) quantity.value = existing.quantity;
        quantityLabel.append(quantity);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'col-span-5 sm:col-span-3 px-2 py-1.5 rounded-lg text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-left';
        remove.textContent = 'Retirer cet intrant';
        remove.addEventListener('click', () => { row.remove(); updateDeliveryEditNeeds(); });
        select.addEventListener('change', updateDeliveryEditNeeds);
        quantity.addEventListener('input', updateDeliveryEditNeeds);
        row.append(stockLabel, quantityLabel, remove);
        $('delivery-edit-items').append(row);
    }

    async function openDeliveryEdit(view, id) {
        const flight = view === 'drones';
        if (!hasRole(flight ? ['admin', 'pilot'] : ['admin', 'logistics']) ||
            deliveryEditLoading || deliveryEditSaving || deliveryEditDraft || activeView !== view || !portSelect.value) return;
        const port = portSelect.value, sequence = requestSequence, requestGeneration = sessionGeneration;
        deliveryEditLoading = true;
        $(`postgres-${view}-status`).textContent = 'Chargement du détail…';
        try {
            const [detail, stocks, plans] = await Promise.all([
                api(`/rest/v1/rpc/qbox_${flight ? 'flight' : 'shipment'}_details`,
                    flight ? {selected_port:port, selected_flight:id} : {selected_port:port, selected_shipment:id}, true),
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true)
            ]);
            if (sequence !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (detail.status !== (flight ? 'En vol' : 'En cours')) throw new Error('Cette opération n’est plus modifiable : actualisez la liste.');
            const plan = plans.find(item => item.id === detail.planning_id);
            if (!plan || detail.items.some(item => !stocks.some(stock => stock.id === item.stock_id &&
                plan.items.some(line => line.csb_id === detail.csb_id && line.product_id === stock.product_id))))
                throw new Error('Planning ou lot introuvable : actualisez les données avant de modifier.');
            deliveryEditDraft = {port, view, detail, stocks, plan};
            $('delivery-edit-title').textContent = flight ? `Modifier le vol ${detail.bl}` : `Modifier l’expédition ${detail.reference}`;
            $('delivery-edit-plan').textContent = `${plan.code} · ${plan.start_date} au ${plan.end_date}`;
            $('delivery-edit-target').textContent = plan.items.find(item => item.csb_id === detail.csb_id)?.csb_name || 'CSB inconnu';
            $('delivery-edit-section-title').textContent = flight ? 'Vol à modifier' : 'Expédition à modifier';
            $('delivery-edit-icon').classList.toggle('ph-airplane-tilt', flight);
            $('delivery-edit-icon').classList.toggle('ph-truck', !flight);
            $('delivery-edit-parcel-title').textContent = flight ? 'Vol · un colis' : 'Expédition terrestre';
            $('delivery-edit-content-label').textContent = flight ? 'Contenu du colis' : 'Contenu de l’expédition';
            $('delivery-edit-reference').textContent = `N° BL : ${flight ? detail.bl : detail.reference}`;
            $('delivery-edit-transport-label').classList.toggle('hidden', flight);
            $('delivery-edit-transport').required = !flight;
            $('delivery-edit-transport').value = flight ? '' : detail.transport;
            $('delivery-edit-items').replaceChildren();
            for (const item of detail.items) addDeliveryEditItem(item);
            updateDeliveryEditNeeds();
            $('delivery-edit-status').textContent = '';
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-delivery-edit').classList.remove('hidden');
        } catch (error) {
            if (sequence === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                $(`postgres-${view}-status`).textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) deliveryEditLoading = false; }
    }

    function closeDeliveryEdit() {
        if (deliveryEditSaving) return;
        deliveryEditDraft = null;
        $('delivery-edit-items').replaceChildren();
        $('delivery-edit-needs').replaceChildren();
        $('modal-delivery-edit').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = false;
    }

    async function submitDeliveryEdit(event) {
        event.preventDefault();
        const draft = deliveryEditDraft;
        if (!draft || deliveryEditSaving) return;
        const flight = draft.view === 'drones';
        if (!hasRole(flight ? ['admin', 'pilot'] : ['admin', 'logistics'])) return;
        const items = [...$('delivery-edit-items').querySelectorAll('.delivery-edit-item')].map(row => ({
            stock_id:row.querySelector('[name=stock]').value, quantity:Number(row.querySelector('[name=quantity]').value)
        }));
        const transport = $('delivery-edit-transport').value.trim();
        if (draft.port !== portSelect.value || !items.length || items.length > 200 ||
            (!flight && (!transport || transport.length > 150)) ||
            items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) ||
            (flight && new Set(items.map(item => item.stock_id)).size !== items.length)) {
            $('delivery-edit-status').textContent = 'Vérifiez le port, le transport et les 1 à 200 lignes avec des quantités valides.';
            return;
        }
        const totals = new Map();
        for (const item of items) totals.set(item.stock_id, (totals.get(item.stock_id) || 0n) + BigInt(item.quantity));
        const returned = draft.detail.items.map(item => ({
            stock_id:item.stock_id, quantity:BigInt(item.quantity) - (totals.get(item.stock_id) || 0n)
        })).filter(item => item.quantity > 0n);
        const description = returned.map(item => {
            const lot = draft.stocks.find(stock => stock.id === item.stock_id);
            return `${lot ? `${lot.name} · Lot ${lot.lot}` : item.stock_id} : ${number(item.quantity)}`;
        }).join('\n');
        const prompt = !flight && returned.length
            ? `Confirmez que ces produits sont physiquement revenus au port et conformes avant leur remise en stock :\n${description}`
            : `Enregistrer les modifications de ${flight ? draft.detail.bl : draft.detail.reference} ?`;
        if (!confirm(prompt)) return;
        const requestGeneration = sessionGeneration;
        deliveryEditSaving = true;
        markFormLocked('delivery-edit-form');
        const controls = [...$('delivery-edit-form').querySelectorAll('input, select, button'), $('delivery-edit-close')];
        controls.forEach(control => { control.disabled = true; });
        try {
            const body = flight
                ? {selected_port:draft.port, selected_flight:draft.detail.id, expected_version:draft.detail.version, items}
                : {selected_port:draft.port, selected_shipment:draft.detail.id, expected_version:draft.detail.version,
                    action:'edit', transport_name:transport, items, return_confirmed:returned.length > 0};
            await api(`/rest/v1/rpc/${flight ? 'qbox_edit_flight_versioned' : 'qbox_change_shipment'}`, body, true);
            if (sessionGeneration !== requestGeneration) return;
            deliveryEditSaving = false;
            closeDeliveryEdit();
            if (frameConnected) sendFrame({type:flight ? 'qbox-flights-changed' : 'qbox-shipments-changed', port:draft.port});
            await refreshDeliveries(draft.view);
            if (sessionGeneration !== requestGeneration) return;
            $(`postgres-${draft.view}-status`).textContent += ' Modification enregistrée.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('delivery-edit-status').textContent = `${error.message} Actualisez la liste avant de recommencer si le résultat est incertain.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('delivery-edit-form');
                deliveryEditSaving = false;
                controls.forEach(control => { control.disabled = false; });
            }
        }
    }

    async function openDeliveryClose(view, id, action = 'close', sourceView = view) {
        if (deliveryCloseLoading || deliveryCloseSaving || deliveryCloseDraft || activeView !== sourceView || !portSelect.value) return;
        if (!hasRole(view === 'drones' ? ['admin', 'pilot'] : ['admin', 'logistics'])) return;
        const port = portSelect.value, sequence = requestSequence, requestGeneration = sessionGeneration;
        deliveryCloseLoading = true;
        const statusId = sourceView === 'dashboard' ? 'postgres-dashboard-status' : `postgres-${view}-status`;
        $(statusId).textContent = 'Chargement du détail…';
        try {
            const flight = view === 'drones';
            const [detail, stocks] = await Promise.all([
                api(`/rest/v1/rpc/qbox_${flight ? 'flight' : 'shipment'}_details`,
                    flight ? {selected_port:port, selected_flight:id} : {selected_port:port, selected_shipment:id}, true),
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true)
            ]);
            if (sequence !== requestSequence || activeView !== sourceView || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (detail.status !== (flight ? 'En vol' : 'En cours')) throw new Error('Cette opération est déjà clôturée ou annulée : actualisez la liste.');
            deliveryCloseDraft = {port, view, sourceView, id, action, version:detail.version, reference:flight ? detail.bl : detail.reference};
            const content = $('postgres-close-delivery-detail');
            content.replaceChildren();
            addLine(content, deliveryCloseDraft.reference);
            for (const item of detail.items) {
                const lot = stocks.find(stock => stock.id === item.stock_id);
                addLine(content, `${lot ? `${lot.name} · Lot ${lot.lot}` : item.stock_id} : ${number(item.quantity)}`);
            }
            const dateParts = new Intl.DateTimeFormat('en-US', {timeZone:'Indian/Antananarivo', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
            const part = name => dateParts.find(item => item.type === name).value;
            $('close-drone-date').value = `${part('year')}-${part('month')}-${part('day')}`;
            $('close-delivery-title').textContent = action === 'cancel'
                ? (flight ? 'Confirmer l’annulation du vol' : 'Confirmer l’annulation de l’expédition')
                : (flight ? 'Confirmer la clôture du vol' : 'Confirmer la clôture de l’expédition');
            $('close-delivery-description').textContent = action === 'cancel'
                ? (flight ? 'Les réservations seront libérées. Confirmez le retour physique des produits au port.'
                    : 'Les produits seront remis en stock. Confirmez leur retour physique au port et leur conformité.')
                : (flight ? 'La clôture déduit le colis du stock et actualise le planning.'
                    : 'La clôture confirme la livraison et actualise le planning. Le stock a déjà été déduit à l’expédition.');
            $('close-delivery-date-field').classList.toggle('hidden', action === 'cancel');
            $('close-drone-date').required = action !== 'cancel';
            $('close-delivery-date-label').textContent = flight ? 'Date exacte du largage / décharge' : 'Date exacte de livraison';
            $('close-delivery-submit').textContent = action === 'cancel' ? 'Confirmer l’annulation' : 'Confirmer la clôture';
            $('postgres-close-delivery-status').textContent = '';
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-close-drone').classList.remove('hidden');
        } catch (error) {
            if (sequence === requestSequence && activeView === sourceView && port === portSelect.value && sessionGeneration === requestGeneration)
                $(statusId).textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) deliveryCloseLoading = false; }
    }

    function closeDeliveryModal() {
        if (deliveryCloseSaving) return;
        deliveryCloseDraft = null;
        $('postgres-close-delivery-detail').replaceChildren();
        $('modal-close-drone').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = false;
    }

    async function submitDeliveryClose(event) {
        event.preventDefault();
        if (!deliveryCloseDraft || deliveryCloseSaving) return;
        const draft = deliveryCloseDraft, flight = draft.view === 'drones', closeDate = $('close-drone-date').value;
        if (!hasRole(flight ? ['admin', 'pilot'] : ['admin', 'logistics']) || draft.port !== portSelect.value || (draft.action === 'close' && !closeDate)) {
            $('postgres-close-delivery-status').textContent = 'Vérifiez vos droits, le port et la date de clôture.';
            return;
        }
        const prompt = draft.action === 'cancel'
            ? (flight ? `Annuler ${draft.reference} ? Confirmez le retour physique des produits au port avant de libérer les réservations.`
                : `Annuler ${draft.reference} ? Confirmez le retour physique et la conformité de tous les produits avant leur remise en stock.`)
            : `Confirmer la clôture de ${draft.reference} ?`;
        if (!confirm(prompt)) return;
        const requestGeneration = sessionGeneration;
        deliveryCloseSaving = true;
        markFormLocked('close-delivery-form');
        const controls = [...$('close-delivery-form').querySelectorAll('input, button'), $('close-delivery-x')];
        controls.forEach(control => { control.disabled = true; });
        try {
            let body;
            let rpc;
            if (draft.action === 'cancel') {
                rpc = flight ? 'qbox_cancel_flight_versioned' : 'qbox_change_shipment';
                body = flight
                    ? {selected_port:draft.port, selected_flight:draft.id, expected_version:draft.version, return_confirmed:true}
                    : {selected_port:draft.port, selected_shipment:draft.id, expected_version:draft.version, action:'cancel', transport_name:null, items:null, return_confirmed:true};
            } else {
                rpc = flight ? 'qbox_close_flight_versioned' : 'qbox_close_shipment_versioned';
                body = flight
                    ? {selected_port:draft.port, selected_flight:draft.id, expected_version:draft.version, close_date:closeDate}
                    : {selected_port:draft.port, selected_shipment:draft.id, expected_version:draft.version, close_date:closeDate};
            }
            await api(`/rest/v1/rpc/${rpc}`, body, true);
            if (sessionGeneration !== requestGeneration) return;
            deliveryCloseSaving = false;
            closeDeliveryModal();
            if (frameConnected) sendFrame({type:flight ? 'qbox-flights-changed' : 'qbox-shipments-changed', port:draft.port});
            if (draft.sourceView === 'dashboard') {
                await refreshDashboard();
                if (sessionGeneration !== requestGeneration) return;
                $('postgres-dashboard-status').textContent += draft.action === 'cancel' ? ' Annulation enregistrée.' : ' Clôture enregistrée.';
            } else {
                await refreshDeliveries(draft.view);
                if (sessionGeneration !== requestGeneration) return;
                $(`postgres-${draft.view}-status`).textContent += draft.action === 'cancel' ? ' Annulation enregistrée.' : ' Clôture enregistrée.';
            }
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-close-delivery-status').textContent = `${error.message} Actualisez la liste pour vérifier le résultat.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('close-delivery-form');
                deliveryCloseSaving = false;
                controls.forEach(control => { control.disabled = false; });
            }
        }
    }

    function updateFlightNeeds() {
        if (!flightDraft) return;
        const plan = flightDraft.plans.find(item => item.id === $('drone-plan').value);
        const target = $('drone-target').value;
        const totals = new Map();
        for (const row of $('drone-flights-container').querySelectorAll('.postgres-flight-item')) {
            const lot = flightDraft.stocks.find(item => item.id === row.querySelector('[name=stock]').value);
            const value = Number(row.querySelector('[name=quantity]').value);
            if (lot && Number.isSafeInteger(value) && value > 0)
                totals.set(lot.product_id, (totals.get(lot.product_id) || 0n) + BigInt(value));
        }
        const box = $('drone-active-planning');
        if (plan) renderDeliveryNeeds(box, plan, target, totals);
        else {
            box.replaceChildren();
            addLine(box, 'Sélectionnez un planning actif pour commencer.');
        }
        $('drone-flights-count').textContent = String($('drone-flights-container').querySelectorAll('.postgres-flight-parcel').length);
    }

    function addDeliveryItem(container, draft, planId, csbId, rowClass, onChange) {
        const row = document.createElement('div');
        row.className = `${rowClass} grid grid-cols-1 sm:grid-cols-2 gap-2 items-end p-2 bg-white border border-slate-200 rounded-xl`;
        const stockLabel = document.createElement('label');
        stockLabel.className = 'text-[10px] font-bold text-slate-600';
        stockLabel.textContent = 'Intrant et lot';
        const select = document.createElement('select');
        select.name = 'stock';
        select.required = true;
        select.className = 'mt-1 w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-400';
        const plan = draft.plans.find(item => item.id === planId);
        const allowed = new Set((plan?.items || []).filter(item => item.csb_id === csbId).map(item => item.product_id));
        for (const lot of draft.stocks.filter(item => allowed.has(item.product_id) && BigInt(item.available) > 0n))
            select.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible : ${number(lot.available)}`, lot.id));
        if (!select.options.length) select.add(new Option('Aucun lot disponible pour ce CSB', ''));
        stockLabel.append(select);
        const quantityLabel = document.createElement('label');
        quantityLabel.className = 'text-[10px] font-bold text-slate-600';
        quantityLabel.textContent = 'Quantité';
        const quantity = document.createElement('input');
        quantity.name = 'quantity';
        quantity.type = 'number';
        quantity.min = '1';
        quantity.max = '9007199254740991';
        quantity.step = '1';
        quantity.required = true;
        quantity.className = 'mt-1 w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-amber-400';
        quantityLabel.append(quantity);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-xs text-red-600 font-bold text-left';
        remove.textContent = 'Retirer cet intrant';
        remove.addEventListener('click', () => { row.remove(); onChange(); });
        select.addEventListener('change', onChange);
        quantity.addEventListener('input', onChange);
        row.append(stockLabel, quantityLabel, remove);
        container.append(row);
    }

    function addFlightItem(parcel) {
        addDeliveryItem(parcel.querySelector('.postgres-flight-items'), flightDraft,
            $('drone-plan').value, $('drone-target').value, 'postgres-flight-item', updateFlightNeeds);
    }

    function addFlightParcel() {
        if (!flightDraft) return;
        const parcel = document.createElement('div');
        parcel.className = 'postgres-flight-parcel p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3';
        parcel.dataset.id = crypto.randomUUID();
        const title = document.createElement('h4');
        title.className = 'text-xs font-extrabold text-slate-900';
        title.textContent = 'Vol · un colis · BL généré à l’enregistrement';
        const items = document.createElement('div');
        items.className = 'postgres-flight-items space-y-2';
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'px-2 py-1 bg-white border border-cyan-300 text-cyan-700 hover:bg-cyan-50 rounded-lg text-[10px] font-bold mr-3';
        add.textContent = 'Ajouter un intrant';
        add.addEventListener('click', () => addFlightItem(parcel));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-xs font-bold text-red-600';
        remove.textContent = 'Retirer ce vol';
        remove.addEventListener('click', () => { parcel.remove(); updateFlightNeeds(); });
        parcel.append(title, items, add, remove);
        $('drone-flights-container').append(parcel);
        addFlightItem(parcel);
        updateFlightNeeds();
    }

    function setFlightTarget() {
        const plan = flightDraft.plans.find(item => item.id === $('drone-plan').value);
        const targets = new Map((plan?.items || []).map(item => [item.csb_id, item.csb_name]));
        $('drone-target').replaceChildren();
        for (const [id, name] of targets) $('drone-target').add(new Option(name, id));
        $('drone-target').disabled = !targets.size;
        flightDraft.plan = $('drone-plan').value;
        flightDraft.target = $('drone-target').value;
        $('drone-flights-container').replaceChildren();
        if (flightDraft.target) addFlightParcel();
        updateFlightNeeds();
    }

    async function openFlights() {
        if (!hasRole(['admin', 'pilot'])) {
            $('postgres-drones-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (flightLoading || flightSaving || !portSelect.value) return;
        const port = portSelect.value, requestGeneration = sessionGeneration, sequence = requestSequence;
        flightLoading = true;
        $('postgres-drones-status').textContent = 'Chargement du formulaire…';
        try {
            const [plans, stocks] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true)
            ]);
            if (sessionGeneration !== requestGeneration || sequence !== requestSequence || activeView !== 'drones' || port !== portSelect.value) return;
            const active = plans.filter(plan => plan.status === 'En cours');
            if (!active.length) throw new Error('Un planning actif est nécessaire pour lancer des vols.');
            flightDraft = {port, plans:active, stocks, target:''};
            $('drone-form-main').reset();
            $('drone-plan').replaceChildren();
            for (const plan of active) $('drone-plan').add(new Option(`${plan.code} · ${plan.start_date} au ${plan.end_date}`, plan.id));
            setFlightTarget();
            $('drone-flights-section').classList.remove('hidden');
            $('postgres-drone-form-status').textContent = '';
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-drone').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration && sequence === requestSequence && activeView === 'drones' && port === portSelect.value)
                $('postgres-drones-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) flightLoading = false; }
    }

    function closeFlights() {
        if (flightSaving) return;
        flightDraft = null;
        $('drone-flights-container').replaceChildren();
        $('drone-active-planning').replaceChildren();
        $('modal-drone').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitFlights(event) {
        event.preventDefault();
        if (!flightDraft || flightSaving || !hasRole(['admin', 'pilot'])) return;
        const draft = flightDraft;
        const flights = [...$('drone-flights-container').querySelectorAll('.postgres-flight-parcel')].map(parcel => ({
            id:parcel.dataset.id, items:[...parcel.querySelectorAll('.postgres-flight-item')].map(row => ({
                stock_id:row.querySelector('[name=stock]').value, quantity:Number(row.querySelector('[name=quantity]').value)
            }))
        }));
        if (draft.port !== portSelect.value || !$('drone-plan').value || !$('drone-target').value ||
            !flights.length || flights.length > 100 || flights.some(flight => !flight.items.length || flight.items.length > 200 ||
                flight.items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) ||
                new Set(flight.items.map(item => item.stock_id)).size !== flight.items.length)) {
            $('postgres-drone-form-status').textContent = 'Vérifiez le port, le CSB et les colis : 1 à 100 vols, 1 à 200 lignes par colis, sans doublon de lot.';
            return;
        }
        if (!confirm(`Enregistrer ${flights.length} vol(s) et réserver les quantités ?`)) return;
        const requestGeneration = sessionGeneration;
        flightSaving = true;
        markFormLocked('drone-form-main');
        const controls = [...$('drone-form-main').querySelectorAll('input, select, button'), $('drone-close')];
        controls.forEach(control => { control.disabled = true; });
        try {
            await api('/rest/v1/rpc/qbox_create_flights', {
                selected_port:draft.port, selected_planning:$('drone-plan').value, selected_csb:$('drone-target').value, flights
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            flightSaving = false;
            closeFlights();
            if (frameConnected) sendFrame({type:'qbox-flights-changed', port:draft.port});
            await refreshDeliveries('drones');
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-drones-status').textContent += ' Vols enregistrés et stocks réservés.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-drone-form-status').textContent = `${error.message} Actualisez les vols et les stocks avant une nouvelle saisie en cas de perte de connexion.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('drone-form-main');
                flightSaving = false;
                controls.forEach(control => { control.disabled = false; });
            }
        }
    }

    function updateShipmentNeeds() {
        if (!shipmentDraft) return;
        const plan = shipmentDraft.plans.find(item => item.id === $('sortie-plan').value);
        const totals = new Map();
        for (const row of $('sortie-items').querySelectorAll('.postgres-shipment-item')) {
            const lot = shipmentDraft.stocks.find(item => item.id === row.querySelector('[name=stock]').value);
            const quantity = Number(row.querySelector('[name=quantity]').value);
            if (lot && Number.isSafeInteger(quantity) && quantity > 0)
                totals.set(lot.product_id, (totals.get(lot.product_id) || 0n) + BigInt(quantity));
        }
        const box = $('postgres-sortie-needs');
        box.replaceChildren();
        const needs = (plan?.items || []).filter(item => item.csb_id === $('sortie-target').value);
        if (!needs.length) addLine(box, 'Aucun besoin pour ce CSB.');
        for (const item of needs) {
            const prepared = totals.get(item.product_id) || 0n;
            const remaining = BigInt(item.remaining) - prepared;
            addLine(box, `${item.product_name} · Restant avant expédition : ${number(item.remaining)} · Cette expédition : ${number(prepared)} · ${remaining < 0n ? `Dépassement : ${number(-remaining)}` : `Restant : ${number(remaining)}`}`);
        }
    }

    function addShipmentItem() {
        if (!shipmentDraft) return;
        addDeliveryItem($('sortie-items'), shipmentDraft, $('sortie-plan').value,
            $('sortie-target').value, 'postgres-shipment-item', updateShipmentNeeds);
        updateShipmentNeeds();
    }

    function setShipmentTarget() {
        const plan = shipmentDraft.plans.find(item => item.id === $('sortie-plan').value);
        const targets = new Map((plan?.items || []).map(item => [item.csb_id, item.csb_name]));
        $('sortie-target').replaceChildren();
        for (const [id, name] of targets) $('sortie-target').add(new Option(name, id));
        shipmentDraft.plan = $('sortie-plan').value;
        shipmentDraft.target = $('sortie-target').value;
        $('sortie-items').replaceChildren();
        if (shipmentDraft.target) addShipmentItem();
        updateShipmentNeeds();
    }

    async function openShipment() {
        if (!hasRole(['admin', 'logistics'])) {
            $('postgres-sorties-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (shipmentLoading || shipmentSaving || !portSelect.value) return;
        const port = portSelect.value, requestGeneration = sessionGeneration, sequence = requestSequence;
        shipmentLoading = true;
        $('postgres-sorties-status').textContent = 'Chargement du formulaire…';
        try {
            const [plans, stocks] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true)
            ]);
            if (sessionGeneration !== requestGeneration || sequence !== requestSequence || activeView !== 'sorties' || port !== portSelect.value) return;
            const active = plans.filter(plan => plan.status === 'En cours');
            if (!active.length) throw new Error('Un planning actif est nécessaire pour enregistrer une expédition.');
            shipmentDraft = {port, plans:active, stocks, id:crypto.randomUUID()};
            $('sortie-form-main').reset();
            $('sortie-id').value = 'Généré à l’enregistrement';
            $('sortie-plan').replaceChildren();
            for (const plan of active) $('sortie-plan').add(new Option(`${plan.code} · ${plan.start_date} au ${plan.end_date}`, plan.id));
            setShipmentTarget();
            $('postgres-sortie-form-status').textContent = '';
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-sortie').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration && sequence === requestSequence && activeView === 'sorties' && port === portSelect.value)
                $('postgres-sorties-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) shipmentLoading = false; }
    }

    function closeShipment() {
        if (shipmentSaving) return;
        shipmentDraft = null;
        $('sortie-items').replaceChildren();
        $('postgres-sortie-needs').replaceChildren();
        $('modal-sortie').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitShipment(event) {
        event.preventDefault();
        if (!shipmentDraft || shipmentSaving || !hasRole(['admin', 'logistics'])) return;
        const draft = shipmentDraft;
        const items = [...$('sortie-items').querySelectorAll('.postgres-shipment-item')].map(row => ({
            stock_id:row.querySelector('[name=stock]').value, quantity:Number(row.querySelector('[name=quantity]').value)
        }));
        const transport = $('sortie-transport').value.trim();
        if (draft.port !== portSelect.value || !$('sortie-plan').value || !$('sortie-target').value ||
            !transport || transport.length > 150 || !items.length || items.length > 200 ||
            items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
            $('postgres-sortie-form-status').textContent = 'Vérifiez le port, le planning, le CSB, le transport et les 1 à 200 lignes.';
            return;
        }
        if (!confirm("Enregistrer l'expédition et déduire les quantités du stock ?")) return;
        const requestGeneration = sessionGeneration;
        shipmentSaving = true;
        markFormLocked('sortie-form-main');
        const controls = [...$('sortie-form-main').querySelectorAll('input, select, button'), $('sortie-close')];
        controls.forEach(control => { control.disabled = true; });
        try {
            const reference = await api('/rest/v1/rpc/qbox_create_shipment', {
                request_id:draft.id, selected_port:draft.port, selected_planning:$('sortie-plan').value,
                selected_csb:$('sortie-target').value, transport_name:transport, items
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            shipmentSaving = false;
            closeShipment();
            if (frameConnected) sendFrame({type:'qbox-shipments-changed', port:draft.port});
            await refreshDeliveries('sorties');
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-sorties-status').textContent += ` Expédition ${reference} enregistrée et stock déduit.`;
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-sortie-form-status').textContent = `${error.message} Actualisez les expéditions et les stocks avant une nouvelle saisie en cas de perte de connexion.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('sortie-form-main');
                shipmentSaving = false;
                controls.forEach(control => { control.disabled = false; });
            }
        }
    }

    function stockHistoryFilter() {
        return {
            from_date: $('stock-history-from').value || null,
            to_date: $('stock-history-to').value || null,
            operation_filter: $('stock-history-type').value || null,
            search_text: $('stock-history-search').value.trim() || null
        };
    }

    function clearStockHistoryCharts() {
        for (const chart of stockHistoryCharts) chart.destroy();
        stockHistoryCharts = [];
    }

    function renderStockHistoryCharts() {
        clearStockHistoryCharts();
        const chartArea = $('stock-history-charts');
        if (typeof window.Chart !== 'function') {
            chartArea.classList.add('postgres-hidden');
            return ' Graphiques indisponibles : Chart.js n’est pas chargé ; ils restent accessibles dans les opérations.';
        }
        chartArea.classList.remove('postgres-hidden');
        const state = stockHistoryState;
        const products = [...state.balances.values()];
        const colors = ['#0284c7', '#d97706', '#059669', '#be185d', '#7c3aed', '#b91c1c', '#0f766e'];
        const entries = [...state.rows].reverse();
        const names = [...new Set(entries.map(entry => entry.product_name))];
        const ambiguous = names.some(name => state.products.filter(item => item.name === name).length > 1);
        const labels = entries.map(entry => localDateTime(entry.occurred_at));
        const datasets = (ambiguous ? [] : names).map((name, index) => ({
            label:name, borderColor:colors[index % colors.length], backgroundColor:colors[index % colors.length],
            data:entries.map(entry => entry.product_name === name ? Number(BigInt(entry.after_stock) - BigInt(entry.after_reserved)) : null),
            spanGaps:true, pointRadius:3, pointHoverRadius:5, borderWidth:2.5, tension:0.15
        }));
        try {
            stockHistoryChartStyle.sizeBars($('stock-history-bar-container'), products.length);
            stockHistoryCharts.push(new window.Chart($('stock-history-bar'), {
                type:'bar', data:{labels:products.map(item => item.name), datasets:[{
                    label:'Disponible', data:products.map(item => Number(item.quantity - item.reserved)),
                    backgroundColor:products.map(item => {
                        const available = item.quantity - item.reserved;
                        if (item.threshold === null || item.threshold <= 0n) return '#64748b';
                        return available < item.threshold ? '#b91c1c' : available * 2n <= item.threshold * 3n ? '#b45309' : '#15803d';
                    }), borderRadius:6, maxBarThickness:22
                }]},
                options:stockHistoryChartStyle.options('bar', true)
            }));
            stockHistoryCharts.push(new window.Chart($('stock-history-line'), {
                type:'line', data:{labels, datasets},
                options:stockHistoryChartStyle.options('line', true)
            }));
            return ambiguous
                ? ' Courbe indisponible : plusieurs intrants portent le même nom. Les valeurs du graphique peuvent être arrondies.'
                : ' Courbes limitées aux mouvements chargés ; les valeurs des graphiques peuvent être arrondies.';
        } catch (error) {
            clearStockHistoryCharts();
            chartArea.classList.add('postgres-hidden');
            return ` Graphiques indisponibles : ${error.message}. Utilisez le panneau d’opérations.`;
        }
    }

    function appendStockHistoryCells(parent, values) {
        const row = document.createElement('tr');
        for (const value of values) {
            const cell = document.createElement('td');
            cell.className = 'py-2 px-2 text-slate-700';
            cell.textContent = value;
            row.append(cell);
        }
        parent.append(row);
    }

    async function refreshLogisticsReport() {
            const port = portSelect.value;
            const year = Number($('logistics-report-year').value);
            const requestGeneration = sessionGeneration;
            const sequence = ++logisticsReportSequence;
            const container = $('logistics-report-months');
            const reportStatus = $('logistics-report-status');
            logisticsReportState = null;
            $('logistics-report-print').disabled = true;
            $('logistics-report-print-context').textContent = '';
            container.replaceChildren();
            if (!port) {
                reportStatus.textContent = 'Sélectionnez un magasin pour afficher le rapport.';
                return;
            }
            reportStatus.textContent = 'Chargement du rapport…';
            try {
                const result = await api('/rest/v1/rpc/qbox_logistics_report', {
                    selected_port: port, selected_year: year
                }, true);
                if (sequence !== logisticsReportSequence || activeView !== 'logistics-report' ||
                    port !== portSelect.value || year !== Number($('logistics-report-year').value) || requestGeneration !== sessionGeneration) return;
                if (!result || !Array.isArray(result.months) || result.months.length !== 12)
                    throw new Error('Données du rapport invalides.');
                const formatQuantity = value => value == null ? '—' : number(value);
                for (const [index, month] of result.months.entries()) {
                    if (month.month !== index + 1 || !Array.isArray(month.items))
                        throw new Error('Données mensuelles invalides.');
                    const section = document.createElement('section');
                    section.className = 'logistics-month';
                    const title = document.createElement('h4');
                    title.textContent = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
                        .format(new Date(Date.UTC(year, month.month - 1, 1)));
                    const wrapper = document.createElement('div');
                    wrapper.className = 'stock-history-table-wrap';
                    const table = document.createElement('table');
                    table.className = 'stock-history-table';
                    const head = document.createElement('thead');
                    const header = document.createElement('tr');
                    for (const label of ['Intrant', 'Stock début du mois', 'Entrées du mois', 'Sorties du mois', 'Stock fin du mois', 'Stock physique fin du mois']) {
                        const th = document.createElement('th');
                        th.scope = 'col';
                        th.textContent = label;
                        header.append(th);
                    }
                    head.append(header);
                    const body = document.createElement('tbody');
                    if (!month.items.length) {
                        const row = document.createElement('tr'), cell = document.createElement('td');
                        cell.colSpan = 6;
                        cell.textContent = 'Aucun intrant à afficher.';
                        row.append(cell);
                        body.append(row);
                    }
                    for (const item of month.items) {
                        const row = document.createElement('tr');
                        for (const value of [
                            `${item.product_name} · ${item.unit}`,
                            formatQuantity(item.opening_stock),
                            formatQuantity(item.incoming)
                        ]) {
                            const cell = document.createElement('td');
                            cell.textContent = value;
                            row.append(cell);
                        }
                        const outgoing = document.createElement('td');
                        const outgoingDetails = document.createElement('div');
                        outgoingDetails.className = 'logistics-outgoing';
                        const total = document.createElement('strong');
                        total.textContent = `Total : ${formatQuantity(item.outgoing)}`;
                        const breakdown = document.createElement('small');
                        breakdown.textContent = `Vol : ${formatQuantity(item.flight_outgoing)} · Terrestre : ${formatQuantity(item.terrestrial_outgoing)} · Transfert : ${formatQuantity(item.transfer_outgoing)} · Autres : ${formatQuantity(item.other_outgoing)}`;
                        outgoingDetails.append(total, breakdown);
                        outgoing.append(outgoingDetails);
                        const closing = document.createElement('td');
                        closing.textContent = formatQuantity(item.closing_stock);
                        if (item.reconciliation_status === 'unreconciled' || item.reconciliation_status === 'unknown') {
                            const reconciliation = document.createElement('span');
                            reconciliation.className = 'logistics-inventory-date';
                            reconciliation.textContent = item.reconciliation_status === 'unreconciled'
                                ? 'Mouvements non réconciliés' : 'Réconciliation indisponible';
                            closing.append(reconciliation);
                        }
                        const physical = document.createElement('td');
                        physical.textContent = formatQuantity(item.physical_stock);
                        if (item.inventory_date) {
                            const date = document.createElement('span');
                            date.className = 'logistics-inventory-date';
                            const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.inventory_date);
                            if (!parts) throw new Error('Date d’inventaire invalide.');
                            date.textContent = `Inventaire : ${parts[3]}/${parts[2]}/${parts[1]}`;
                            physical.append(date);
                        }
                        row.append(outgoing, closing, physical);
                        body.append(row);
                    }
                    table.append(head, body);
                    wrapper.append(table);
                    section.append(title, wrapper);
                    container.append(section);
                }
                reportStatus.textContent = Array.isArray(result.warnings) && result.warnings.length
                    ? result.warnings.join(' ') : 'Rapport actualisé.';
                const warehouse = warehouseRows.find(row => row.id === port);
                if (!warehouse) throw new Error('Magasin sélectionné introuvable.');
                $('logistics-report-print-context').textContent = `Magasin : ${warehouse.name} · ${warehouse.region} | Année : ${year}`;
                logisticsReportState = { port, year };
                $('logistics-report-print').disabled = false;
            } catch (error) {
                if (sequence !== logisticsReportSequence || activeView !== 'logistics-report' ||
                    port !== portSelect.value || year !== Number($('logistics-report-year').value) || requestGeneration !== sessionGeneration) return;
                container.replaceChildren();
                reportStatus.textContent = `Rapport indisponible : ${error.message}`;
            }
    }

    function printLogisticsReport() {
        if (!logisticsReportState || activeView !== 'logistics-report' || !token ||
            logisticsReportState.port !== portSelect.value ||
            logisticsReportState.year !== Number($('logistics-report-year').value)) {
            $('logistics-report-status').textContent = 'Chargez le rapport du magasin et de l’année sélectionnés avant impression.';
            return;
        }
        document.body.classList.add('logistics-report-print-mode');
        try {
            window.print();
        } catch (error) {
            document.body.classList.remove('logistics-report-print-mode');
            $('logistics-report-status').textContent = `Impression impossible : ${error.message}`;
        }
    }

    function openStockHistoryPrint() {
        const state = stockHistoryState;
        if (!state || state.port !== portSelect.value || JSON.stringify(state.filter) !== JSON.stringify(stockHistoryFilter())) {
            $('stock-history-status').textContent = 'Appliquez les filtres et chargez les mouvements avant impression.';
            return;
        }
        const report = $('stock-history-print-content');
        report.replaceChildren();
        const header = document.createElement('div');
        header.className = 'stock-report-header';
        const identity = document.createElement('div');
        identity.className = 'stock-report-identity';
        const logo = document.createElement('img');
        logo.src = 'logo-unfpa.svg';
        logo.alt = 'Logo UNFPA';
        logo.className = 'stock-report-logo';
        const organization = document.createElement('div');
        organization.className = 'stock-report-organization';
        const brand = document.createElement('span');
        brand.textContent = 'Q.box · Logistique santé';
        organization.append(brand);
        identity.append(logo, organization);
        const headerMeta = document.createElement('div');
        headerMeta.className = 'stock-report-header-meta';
        const reportKind = document.createElement('strong');
        reportKind.textContent = 'RAPPORT DE STOCK';
        const port = document.createElement('span');
        port.textContent = portSelect.selectedOptions[0]?.textContent || state.port;
        const snapshot = document.createElement('span');
        snapshot.textContent = `Instantané : ${localDateTime(state.loadedAt)} (Madagascar)`;
        headerMeta.append(reportKind, port, snapshot);
        header.append(identity, headerMeta);
        report.append(header);
        const info = [
            ['h1', 'Historique global des stocks'],
            ['p', `Filtres : du ${state.filter.from_date || 'début'} au ${state.filter.to_date || 'présent'} · Opération : ${state.filter.operation_filter || 'toutes'} · Intrant : ${state.filter.search_text || 'tous'}`],
            ['p', `${state.count} mouvement(s) chargé(s)${state.cursor ? ' ; couverture potentiellement partielle, d’autres mouvements peuvent être chargés.' : '.'}`],
            ['p', 'Les données reflètent l’instantané chargé ; actualisez pour obtenir les données récentes.'],
            ['h2', 'Synthèse actuelle']
        ];
        for (const [tag, value] of info) {
            const node = document.createElement(tag);
            node.textContent = value;
            report.append(node);
        }
        function table(headers, rows) {
            const element = document.createElement('table');
            const head = document.createElement('thead'), heading = document.createElement('tr');
            for (const title of headers) {
                const cell = document.createElement('th');
                cell.textContent = title;
                heading.append(cell);
            }
            head.append(heading);
            const body = document.createElement('tbody');
            for (const row of rows) appendStockHistoryCells(body, row);
            element.append(head, body);
            report.append(element);
        }
        table(['Intrant', 'Stock', 'Réservé', 'Disponible'], [...state.balances.values()].map(item =>
            [item.name, number(item.quantity), number(item.reserved), number(item.quantity - item.reserved)]));
        const title = document.createElement('h2');
        title.textContent = 'Mouvements chargés (heure de Madagascar)';
        report.append(title);
        table(['Date', 'Intrant', 'Opération / référence', 'Avant', 'Après', 'Réservé après', 'Disponible après', 'Utilisateur'],
            state.rows.map(entry => [localDateTime(entry.occurred_at), entry.product_name,
                `${entry.operation}${entry.reference ? ` · ${entry.reference}` : ''}`,
                entry.before_stock === null ? 'Inconnu' : number(entry.before_stock), number(entry.after_stock),
                number(entry.after_reserved), number(BigInt(entry.after_stock) - BigInt(entry.after_reserved)), entry.performed_by_name || 'Nom non renseigné']));
        const inventoryTitle = document.createElement('h2');
        inventoryTitle.textContent = 'Inventaires filtrés';
        report.append(inventoryTitle);
        if (!state.inventories.length) addLine(report, 'Aucun inventaire pour ces filtres.');
        for (const inventory of state.inventories) {
            addLine(report, `${localDateTime(inventory.created_at)} (Madagascar) · ${inventory.created_by_name || 'Nom non renseigné'} · ${inventory.id}`);
            if (inventory.observations) {
                const note = document.createElement('p');
                note.style.whiteSpace = 'pre-wrap';
                note.textContent = `Remarques et observations : ${inventory.observations}`;
                report.append(note);
            }
            table(['Intrant', 'Lot', 'Attendu', 'Compté', 'Écart'], inventory.items.map(item => [
                item.product_name, item.lot, number(BigInt(item.system_quantity) - BigInt(item.in_delivery)),
                number(item.counted), number(item.difference)
            ]));
        }
        stockHistoryPrintOpen = true;
        portSelect.disabled = true;
        $('modal-backdrop').classList.remove('hidden');
        $('stock-history-print-modal').classList.remove('hidden');
    }

    function exportStockHistory() {
        const state = stockHistoryState;
        if (!state || state.port !== portSelect.value || JSON.stringify(state.filter) !== JSON.stringify(stockHistoryFilter())) {
            $('stock-history-status').textContent = 'Appliquez les filtres et chargez les mouvements avant export.';
            return;
        }
        try {
            const filter = `du ${state.filter.from_date || 'début'} au ${state.filter.to_date || 'présent'} · Opération : ${state.filter.operation_filter || 'toutes'} · Intrant : ${state.filter.search_text || 'tous'}`;
            const csv = historyCsv(state.rows, {
                port:portSelect.selectedOptions[0]?.textContent || state.port,
                filter, coverage:state.cursor ? 'Potentiellement partielle : mouvements chargés uniquement' : 'Mouvements chargés'
            });
            const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'qbox-mouvements-charges.csv';
            document.body.append(link);
            try { link.click(); } finally {
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            $('stock-history-status').textContent = `${state.count} mouvement(s) chargé(s) exporté(s)${state.cursor ? ' ; d’autres mouvements peuvent ne pas être inclus.' : '.'}`;
        } catch (error) {
            $('stock-history-status').textContent = `Impossible d’exporter les mouvements : ${error.message}`;
        }
    }

    function closeStockHistoryPrint() {
        stockHistoryPrintOpen = false;
        $('stock-history-print-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('stock-history-print-content').replaceChildren();
        document.body.classList.remove('stock-history-print-mode');
        portSelect.disabled = false;
    }

    async function refreshStockHistory(loadMore = false) {
        const port = portSelect.value, filter = stockHistoryFilter();
        const status = $('stock-history-status'), more = $('postgres-stock-history-more');
        if (loadMore && (!stockHistoryState?.cursor || stockHistoryState.port !== port)) return;
        if (loadMore && JSON.stringify(filter) !== JSON.stringify(stockHistoryState.filter)) {
            status.textContent = 'Les filtres ont changé : appliquez-les avant de charger la suite.';
            return;
        }
        const sequence = ++requestSequence, requestGeneration = sessionGeneration;
        if (!loadMore) {
            stockHistoryState = null;
            clearStockHistoryCharts();
            $('stock-history-charts').classList.add('postgres-hidden');
            for (const id of ['stock-history-summary', 'stock-history-movements', 'stock-history-inventories']) $(id).replaceChildren();
            more.classList.add('hidden');
        }
        if (!port) { status.textContent = 'Aucun port disponible.'; return; }
        if (filter.from_date && filter.to_date && filter.from_date > filter.to_date) {
            stockHistoryState = null;
            for (const id of ['stock-history-summary', 'stock-history-movements', 'stock-history-inventories']) $(id).replaceChildren();
            more.classList.add('hidden');
            status.textContent = 'La date de début doit précéder ou égaler la date de fin.';
            return;
        }
        const cursor = loadMore ? stockHistoryState.cursor : null;
        status.textContent = 'Chargement…';
        more.disabled = true;
        try {
            const requests = [api('/rest/v1/rpc/qbox_stock_history', {
                selected_port:port, ...filter, before_time:cursor?.time || null, before_id:cursor?.id || null
            }, true)];
            if (!loadMore) requests.push(
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_inventories', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_products', {}, true)
            );
            const [rows, stocks, inventories, products] = await Promise.all(requests);
            if (sequence !== requestSequence || activeView !== 'stock-history' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (JSON.stringify(stockHistoryFilter()) !== JSON.stringify(filter)) {
                status.textContent = 'Les filtres ont changé : appliquez-les pour actualiser les résultats.';
                return;
            }
            if (!loadMore) {
                stockHistoryState = {port, filter, cursor:null, count:0, rows:[], balances:new Map(), products, inventories:[], loadedAt:new Date()};
                const balances = new Map(), search = (filter.search_text || '').toLocaleLowerCase('fr');
                for (const stock of stocks) {
                    if (search && !stock.name.toLocaleLowerCase('fr').includes(search)) continue;
                    const product = products.find(item => item.id === stock.product_id);
                    const balance = balances.get(stock.product_id) || {name:stock.name, quantity:0n, reserved:0n,
                        threshold:product?.min_threshold == null ? null : BigInt(product.min_threshold)};
                    balance.quantity += BigInt(stock.quantity);
                    balance.reserved += BigInt(stock.reserved);
                    balances.set(stock.product_id, balance);
                }
                for (const balance of balances.values())
                    appendStockHistoryCells($('stock-history-summary'), [balance.name, number(balance.quantity), number(balance.reserved), number(balance.quantity - balance.reserved)]);
                stockHistoryState.balances = balances;
                const list = $('stock-history-inventories');
                for (const inventory of inventories) {
                    const date = new Date(inventory.created_at).toLocaleDateString('sv-SE', {timeZone:'Indian/Antananarivo'});
                    if ((filter.from_date && date < filter.from_date) || (filter.to_date && date > filter.to_date) ||
                        (filter.operation_filter && filter.operation_filter !== 'Inventaire physique')) continue;
                    const items = inventory.items.filter(item => !search || item.product_name.toLocaleLowerCase('fr').includes(search));
                    if (!items.length) continue;
                    stockHistoryState.inventories.push({...inventory, items});
                    const card = document.createElement('details');
                    card.className = 'border border-slate-200 rounded-xl p-3 text-xs';
                    const summary = document.createElement('summary');
                    summary.className = 'font-bold cursor-pointer text-slate-800';
                    summary.textContent = `${localDateTime(inventory.created_at)} (Madagascar) · ${inventory.created_by_name || 'Nom non renseigné'} · ${inventory.id}`;
                    const scroll = document.createElement('div');
                    scroll.className = 'stock-history-inventory-table';
                    const table = document.createElement('table');
                    const head = document.createElement('thead');
                    const heading = document.createElement('tr');
                    for (const label of ['Intrant', 'Lot', 'Attendu', 'Compté', 'Écart']) {
                        const th = document.createElement('th');
                        th.scope = 'col';
                        th.textContent = label;
                        heading.append(th);
                    }
                    head.append(heading);
                    const body = document.createElement('tbody');
                    for (const item of items) appendStockHistoryCells(body, [
                        item.product_name, item.lot, number(BigInt(item.system_quantity) - BigInt(item.in_delivery)),
                        number(item.counted), number(item.difference)
                    ]);
                    table.append(head, body);
                    scroll.append(table);
                    const explanation = document.createElement('p');
                    explanation.className = 'mt-2 text-slate-500';
                    explanation.textContent = 'Comptage hors produits en quarantaine et colis drone en livraison.';
                    card.append(summary, scroll, explanation);
                    if (inventory.observations) {
                        const note = document.createElement('p');
                        note.className = 'mt-2 text-slate-600';
                        note.style.whiteSpace = 'pre-wrap';
                        note.textContent = `Remarques et observations : ${inventory.observations}`;
                        card.append(note);
                    }
                    list.append(card);
                }
                if (!list.children.length) {
                    const empty = document.createElement('p');
                    empty.className = 'text-xs text-slate-500';
                    empty.textContent = 'Aucun inventaire pour ces filtres.';
                    list.append(empty);
                }
            }
            for (const entry of rows) {
                const before = entry.before_stock === null ? null : BigInt(entry.before_stock);
                const after = BigInt(entry.after_stock), reserved = BigInt(entry.after_reserved);
                appendStockHistoryCells($('stock-history-movements'), [
                    `${localDateTime(entry.occurred_at)} (Madagascar)`, entry.product_name,
                    `${entry.operation}${entry.reference ? ` · ${entry.reference}` : ''}`,
                    before === null ? 'Inconnue' : number(after - before), before === null ? 'Inconnu' : number(before),
                    number(after), number(reserved), number(after - reserved), entry.performed_by_name || 'Nom non renseigné'
                ]);
            }
            stockHistoryState.count += rows.length;
            stockHistoryState.rows.push(...rows);
            stockHistoryState.cursor = rows.length === 100 ? {time:rows[rows.length - 1].occurred_at, id:rows[rows.length - 1].id} : null;
            more.classList.toggle('hidden', !stockHistoryState.cursor);
            status.textContent = `${stockHistoryState.count} mouvement(s) chargé(s)${stockHistoryState.cursor ? ' ; d’autres mouvements peuvent être chargés.' : '.'}${renderStockHistoryCharts()}`;
        } catch (error) {
            if (sequence === requestSequence && activeView === 'stock-history' && port === portSelect.value && sessionGeneration === requestGeneration)
                status.textContent = `Lecture indisponible : ${error.message}`;
        } finally {
            if (sequence === requestSequence) more.disabled = false;
        }
    }

    async function refreshInventories() {
        const port = portSelect.value, sequence = ++requestSequence, requestGeneration = sessionGeneration;
        const list = $('inventory-history');
        list.replaceChildren();
        $('postgres-inventory-status').textContent = port ? 'Chargement…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const inventories = await api('/rest/v1/rpc/qbox_list_inventories', {selected_port:port}, true);
            if (sequence !== requestSequence || activeView !== 'inventory' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (!inventories.length) addLine(list, 'Aucun inventaire pour ce port.');
            for (const inventory of inventories) {
                const card = document.createElement('details');
                card.className = 'border border-slate-200 rounded-xl overflow-hidden';
                const summary = document.createElement('summary');
                summary.className = 'p-3 cursor-pointer text-xs font-bold text-slate-800';
                summary.textContent = `${localDateTime(inventory.created_at)} (Madagascar) · ${inventory.created_by_name || 'Nom non renseigné'} · ${inventory.items.length} lot(s) · ${inventory.id}`;
                const scroll = document.createElement('div');
                scroll.className = 'overflow-x-auto border-t border-slate-200';
                const table = document.createElement('table');
                table.className = 'w-full text-xs text-left';
                const header = document.createElement('tr');
                header.className = 'text-slate-500';
                for (const label of ['Intrant / lot', 'Théorique physique', 'En livraison', 'Compté', 'Écart']) {
                    const th = document.createElement('th');
                    th.scope = 'col';
                    th.className = 'p-2';
                    th.textContent = label;
                    header.append(th);
                }
                const head = document.createElement('thead');
                head.append(header);
                const body = document.createElement('tbody');
                for (const item of inventory.items) {
                    const expected = BigInt(item.system_quantity) - BigInt(item.in_delivery);
                    const row = tableRow([`${item.product_name} · Lot ${item.lot}`, number(expected),
                        number(item.in_delivery), number(item.counted), number(item.difference)]);
                    row.className = 'border-t border-slate-100';
                    body.append(row);
                }
                table.append(head, body);
                scroll.append(table);
                const print = document.createElement('button');
                print.type = 'button';
                print.className = 'm-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-sky-700';
                print.textContent = 'Aperçu du rapport';
                print.addEventListener('click', () => openInventoryPrint(inventory.id));
                card.append(summary, scroll);
                if (inventory.observations) {
                    const note = document.createElement('p');
                    note.className = 'mx-3 text-xs text-slate-600';
                    note.style.whiteSpace = 'pre-wrap';
                    note.textContent = `Remarques et observations : ${inventory.observations}`;
                    card.append(note);
                }
                card.append(print);
                list.append(card);
            }

            $('postgres-inventory-status').textContent = `${inventories.length} inventaire(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === requestSequence && activeView === 'inventory' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-inventory-status').textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    async function openInventoryPrint(id) {
        if (inventoryPrintDraft || activeView !== 'inventory' || !portSelect.value) return;
        const port = portSelect.value, sequence = ++inventoryPrintSequence, request = requestSequence, requestGeneration = sessionGeneration;
        $('postgres-inventory-status').textContent = 'Relecture de l’inventaire…';
        try {
            const [inventories, ports] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_inventories', {selected_port:port}, true),
                api('/rest/v1/rpc/qbox_list_ports', {}, true)
            ]);
            if (sequence !== inventoryPrintSequence || request !== requestSequence || activeView !== 'inventory' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const inventory = inventories.find(item => item.id === id);
            const selectedPort = ports.find(item => item.id === port);
            if (!inventory || !selectedPort) throw new Error('Inventaire ou port introuvable : actualisez la liste.');
            renderInventoryReport(inventory, selectedPort.name, $('inventory-print-report'));
            inventoryPrintDraft = {id, port};
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('inventory-print-modal').classList.remove('hidden');
            $('postgres-inventory-status').textContent = 'Rapport relu depuis PostgreSQL.';
        } catch (error) {
            if (sequence === inventoryPrintSequence && request === requestSequence && activeView === 'inventory' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-inventory-status').textContent = `Impossible d’ouvrir le rapport : ${error.message}`;
        }
    }

    function closeInventoryPrint() {
        inventoryPrintSequence++;
        inventoryPrintDraft = null;
        $('inventory-print-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('inventory-print-report').replaceChildren();
        document.body.classList.remove('postgres-inventory-print');
        portSelect.disabled = false;
    }

    async function openInventory() {
        if (!hasRole(['admin', 'logistics'])) {
            $('postgres-inventory-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (inventoryLoading || inventorySaving || inventoryDraft || !portSelect.value) return;
        const port = portSelect.value, sequence = requestSequence, requestGeneration = sessionGeneration;
        inventoryLoading = true;
        $('postgres-inventory-status').textContent = 'Chargement de l’instantané…';
        try {
            const snapshot = await api('/rest/v1/rpc/qbox_inventory_snapshot', {selected_port:port}, true);
            if (sequence !== requestSequence || activeView !== 'inventory' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (!snapshot.items.length) throw new Error('Aucun lot à inventorier.');
            inventoryDraft = {port, revision:snapshot.revision, id:crypto.randomUUID()};
            $('inventory-observations').value = '';
            const rows = $('inventory-count-rows');
            rows.replaceChildren();
            for (const item of snapshot.items) {
                const row = document.createElement('tr');
                for (const value of [`${item.product_name} · Lot ${item.lot}`, number(item.expected), number(item.in_delivery)]) {
                    const cell = document.createElement('td');
                    cell.className = 'p-2';
                    cell.textContent = value;
                    row.append(cell);
                }
                const cell = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.max = '9007199254740991';
                input.step = '1';
                input.required = true;
                input.dataset.stockId = item.stock_id;
                input.className = 'postgres-inventory-count w-full border rounded-lg p-2';
                const difference = document.createElement('td');
                difference.className = 'p-2 text-right';
                difference.textContent = '—';
                input.addEventListener('input', () => {
                    const value = Number(input.value);
                    difference.textContent = input.value !== '' && Number.isSafeInteger(value) && value >= 0
                        ? number(BigInt(value) - BigInt(item.expected)) : '—';
                });
                cell.append(input);
                row.append(cell, difference);
                rows.append(row);
            }
            $('postgres-inventory-status').textContent = `Instantané chargé · Identifiant : ${inventoryDraft.id}.`;
            $('inventory-form').classList.remove('hidden');
            $('inventory-new').disabled = true;
            portSelect.disabled = true;
        } catch (error) {
            if (sequence === requestSequence && activeView === 'inventory' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-inventory-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) inventoryLoading = false; }
    }

    function closeInventory() {
        if (inventorySaving || !inventoryDraft) return;
        if (!confirm('Abandonner le comptage en cours ?')) return;
        inventoryDraft = null;
        $('inventory-form').classList.add('hidden');
        $('inventory-count-rows').replaceChildren();
        $('inventory-new').disabled = false;
        portSelect.disabled = false;
        refreshInventories();
    }

    async function submitInventory(event) {
        event.preventDefault();
        if (!inventoryDraft || inventorySaving || !hasRole(['admin', 'logistics'])) return;
        const draft = inventoryDraft;
        const inputs = [...$('inventory-count-rows').querySelectorAll('.postgres-inventory-count')];
        if (draft.port !== portSelect.value || !inputs.length ||
            inputs.some(input => input.value === '' || !Number.isSafeInteger(Number(input.value)) || Number(input.value) < 0)) {
            $('postgres-inventory-status').textContent = 'Vérifiez le port et comptez chaque lot avec une quantité entière valide.';
            return;
        }
        if (!confirm('Valider cet inventaire et ajuster les stocks du port ?')) return;
        const requestGeneration = sessionGeneration;
        inventorySaving = true;
        markFormLocked('inventory-form');
        const controls = [...$('inventory-form').querySelectorAll('input, textarea, button')];
        controls.forEach(control => { control.disabled = true; });
        try {
            await api('/rest/v1/rpc/qbox_submit_inventory', {
                request_id:draft.id, selected_port:draft.port, expected_revision:draft.revision,
                counts:inputs.map(input => ({stock_id:input.dataset.stockId, counted:Number(input.value)})),
                inventory_observations:$('inventory-observations').value.trim()
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            inventoryDraft = null;
            $('inventory-form').classList.add('hidden');
            $('inventory-count-rows').replaceChildren();
            $('inventory-new').disabled = false;
            portSelect.disabled = false;
            if (frameConnected) sendFrame({type:'qbox-inventory-changed', port:draft.port});
            await refreshInventories();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-inventory-status').textContent += ' Inventaire validé.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-inventory-status').textContent = `${error.message} Si la connexion a été interrompue, vérifiez l’historique avant de recommencer.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('inventory-form');
                inventorySaving = false;
                controls.forEach(control => { control.disabled = false; });
            }
        }
    }

    async function refreshQuarantines() {
        const port = portSelect.value, sequence = ++requestSequence, requestGeneration = sessionGeneration;
        const list = $('quarantine-list');
        list.replaceChildren();
        $('postgres-quarantine-status').textContent = port ? 'Chargement…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const rows = await api('/rest/v1/rpc/qbox_list_quarantines', {selected_port:port}, true);
            if (sequence !== requestSequence || activeView !== 'quarantine' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (!rows.length) addLine(list, 'Aucune quarantaine pour ce port.');
            for (const entry of rows) {
                const card = document.createElement('article');
                card.className = 'border border-slate-200 rounded-xl p-3 text-xs space-y-2';
                const heading = document.createElement('div');
                heading.className = 'flex flex-wrap items-center justify-between gap-2';
                const identity = document.createElement('span');
                identity.className = 'font-bold text-slate-900';
                identity.textContent = `${entry.product_name} · Lot ${entry.lot} · ${entry.reason}`;
                const badge = document.createElement('span');
                badge.className = `px-2 py-1 rounded-full font-bold ${entry.status === 'En quarantaine' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`;
                badge.textContent = entry.status;
                heading.append(identity, badge);
                card.append(heading);
                const info = document.createElement('p');
                info.className = 'text-slate-600';
                info.textContent = `Quantité : ${number(entry.quantity)} · Péremption : ${entry.expiry_date || 'Non renseignée'} · ${localDateTime(entry.created_at)} (Madagascar)`;
                card.append(info);
                if (entry.status === 'En quarantaine' && hasRole(['admin', 'logistics'])) {
                    for (const [resolution, label] of [['release', 'Remettre en stock'], ['destroy', 'Détruire']]) {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.className = `mr-2 px-3 py-1.5 rounded-lg text-xs font-bold ${resolution === 'release' ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' : 'bg-rose-100 hover:bg-rose-200 text-rose-800'}`;
                        button.textContent = label;
                        button.addEventListener('click', () => resolveQuarantine(port, entry, resolution, button));
                        card.append(button);
                    }
                }
                const history = document.createElement('details');
                const historyTitle = document.createElement('summary');
                historyTitle.className = 'cursor-pointer text-slate-600 font-semibold';
                historyTitle.textContent = 'Historique des opérations';
                history.append(historyTitle);
                for (const action of entry.actions)
                    addLine(history, `${action.action} · ${localDateTime(action.performed_at)} (Madagascar) · ${action.performed_by_name || 'Nom non renseigné'}`);
                card.append(history);
                list.append(card);
            }
            $('postgres-quarantine-status').textContent = `${rows.length} quarantaine(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === requestSequence && activeView === 'quarantine' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-quarantine-status').textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    async function openQuarantine() {
        if (!hasRole(['admin', 'logistics'])) {
            $('postgres-quarantine-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (quarantineLoading || quarantineSaving || quarantineDraft || !portSelect.value) return;
        const port = portSelect.value, sequence = requestSequence, requestGeneration = sessionGeneration;
        quarantineLoading = true;
        $('postgres-quarantine-status').textContent = 'Chargement des lots…';
        try {
            const stocks = await api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true);
            if (sequence !== requestSequence || activeView !== 'quarantine' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const available = stocks.filter(item => BigInt(item.available) > 0n);
            if (!available.length) throw new Error('Aucun lot disponible.');
            quarantineDraft = {port, id:crypto.randomUUID()};
            $('quarantine-form-main').reset();
            $('quarantine-stock').replaceChildren();
            for (const lot of available)
                $('quarantine-stock').add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible : ${number(lot.available)}`, lot.id));
            $('postgres-quarantine-status').textContent = `Identifiant de la demande : ${quarantineDraft.id}.`;
            $('quarantine-form-main').classList.remove('hidden');
            $('postgres-quarantine-new').disabled = true;
            portSelect.disabled = true;
        } catch (error) {
            if (sequence === requestSequence && activeView === 'quarantine' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-quarantine-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) quarantineLoading = false; }
    }

    function closeQuarantine() {
        if (quarantineSaving || !quarantineDraft) return;
        quarantineDraft = null;
        $('quarantine-form-main').classList.add('hidden');
        $('quarantine-stock').replaceChildren();
        $('postgres-quarantine-new').disabled = false;
        portSelect.disabled = false;
        refreshQuarantines();
    }

    async function submitQuarantine(event) {
        event.preventDefault();
        if (!quarantineDraft || quarantineSaving || !hasRole(['admin', 'logistics'])) return;
        const draft = quarantineDraft, quantity = Number($('quarantine-quantity').value);
        if (draft.port !== portSelect.value || !$('quarantine-stock').value || !$('quarantine-reason').value ||
            !Number.isSafeInteger(quantity) || quantity <= 0) {
            $('postgres-quarantine-status').textContent = 'Vérifiez le port, le lot, la quantité et le motif.';
            return;
        }
        const requestGeneration = sessionGeneration;
        quarantineSaving = true;
        markFormLocked('quarantine-form-main');
        const controls = [...$('quarantine-form-main').querySelectorAll('input, select, button')];
        controls.forEach(control => { control.disabled = true; });
        try {
            await api('/rest/v1/rpc/qbox_quarantine_stock', {
                request_id:draft.id, selected_port:draft.port, selected_stock:$('quarantine-stock').value,
                amount:quantity, quarantine_reason:$('quarantine-reason').value
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            quarantineDraft = null;
            $('quarantine-form-main').classList.add('hidden');
            $('quarantine-stock').replaceChildren();
            $('postgres-quarantine-new').disabled = false;
            portSelect.disabled = false;
            if (frameConnected) sendFrame({type:'qbox-quarantine-changed', port:draft.port});
            await refreshQuarantines();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-quarantine-status').textContent += ' Lot mis en quarantaine.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-quarantine-status').textContent = `${error.message} Si la connexion a été interrompue, vérifiez la liste avant de recommencer.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('quarantine-form-main');
                quarantineSaving = false;
                controls.forEach(control => { control.disabled = false; });
            }
        }
    }

    async function resolveQuarantine(port, entry, resolution, button) {
        if (quarantineDraft || quarantineSaving || port !== portSelect.value || !hasRole(['admin', 'logistics'])) return;
        const question = resolution === 'release'
            ? `Confirmez-vous que le lot ${entry.lot} est conforme et peut être remis en stock ?`
            : `Confirmez-vous la destruction de ${number(entry.quantity)} unités du lot ${entry.lot} ?`;
        if (!confirm(question)) return;
        const requestGeneration = sessionGeneration;
        quarantineSaving = true;
        button.disabled = true;
        portSelect.disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_resolve_quarantine', {selected_port:port, selected_quarantine:entry.id, resolution}, true);
            if (sessionGeneration !== requestGeneration) return;
            if (frameConnected) sendFrame({type:'qbox-quarantine-changed', port});
            await refreshQuarantines();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-quarantine-status').textContent += ' Quarantaine clôturée.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-quarantine-status').textContent = `${error.message} Vérifiez la liste avant de réessayer si la connexion a été interrompue.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                quarantineSaving = false;
                button.disabled = false;
                portSelect.disabled = activeView === 'operations';
            }
        }
    }

    function addPlanningRow(container, item = null) {
        const row = document.createElement('div');
        row.className = 'planning-item flex flex-wrap sm:flex-nowrap items-end gap-2';
        const productLabel = document.createElement('label');
        productLabel.className = 'flex-1 min-w-[150px] text-[10px] font-semibold text-slate-700';
        productLabel.textContent = 'Intrant';
        const select = document.createElement('select');
        select.name = 'product';
        select.required = true;
        select.className = 'mt-1 w-full text-xs px-2 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-400';
        for (const option of planningProducts) select.add(new Option(`${option.code} · ${option.name}`, option.id));
        if (item) select.value = item.product_id;
        productLabel.append(select);
        const label = document.createElement('label');
        label.className = 'w-28 text-[10px] font-semibold text-slate-700';
        label.textContent = 'Quantité prévue';
        const quantity = document.createElement('input');
        quantity.name = 'quantity';
        quantity.type = 'number';
        quantity.required = true;
        quantity.min = '1';
        quantity.max = '9007199254740991';
        quantity.step = '1';
        quantity.className = 'mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-amber-400';
        if (item) quantity.value = item.planned;
        label.append(quantity);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-red-600 hover:text-red-700';
        remove.textContent = 'Retirer cette ligne';
        remove.addEventListener('click', () => row.remove());
        row.append(productLabel, label, remove);
        container.append(row);
    }

    function addPlanningCsb(csbId = '', items = []) {
        const block = document.createElement('div');
        block.className = 'planning-csb p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3';
        const heading = document.createElement('div');
        heading.className = 'flex flex-wrap items-end gap-2';
        const label = document.createElement('label');
        label.className = 'flex-1 min-w-[150px] text-[11px] font-semibold text-slate-700';
        label.textContent = 'Sélectionner un CSB';
        const select = document.createElement('select');
        select.name = 'csb';
        select.required = true;
        select.className = 'mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-amber-400';
        for (const csb of planningCsbs) select.add(new Option(`${csb.code} · ${csb.name}`, csb.id));
        if (csbId) select.value = csbId;
        label.append(select);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-xs font-bold text-red-600 hover:text-red-700';
        remove.textContent = 'Retirer ce CSB';
        remove.addEventListener('click', () => block.remove());
        heading.append(label, remove);
        const section = document.createElement('div');
        section.className = 'border-t border-slate-200 pt-3 space-y-2';
        const toolbar = document.createElement('div');
        toolbar.className = 'flex flex-wrap items-center justify-between gap-2';
        const title = document.createElement('span');
        title.className = 'text-[10px] font-bold text-slate-600 uppercase tracking-wider';
        title.textContent = 'Intrants requis pour ce CSB';
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'text-[11px] text-sky-600 font-bold hover:underline';
        add.textContent = 'Ajouter un intrant';
        const rows = document.createElement('div');
        rows.className = 'space-y-2';
        add.addEventListener('click', () => addPlanningRow(rows));
        toolbar.append(title, add);
        section.append(toolbar, rows);
        block.append(heading, section);
        $('plan-csb-blocks').append(block);
        if (items.length) items.forEach(item => addPlanningRow(rows, item));
        else addPlanningRow(rows);
    }

    async function openPlanning(id = null) {
        if (!hasRole(['admin', 'logistics'])) {
            $('postgres-planning-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (planningLoading || planningSaving || !portSelect.value) return;
        const port = portSelect.value, requestGeneration = sessionGeneration, sequence = requestSequence;
        planningLoading = true;
        $('postgres-planning-status').textContent = 'Chargement du formulaire…';
        try {
            const [csbs, products, plans] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_csbs', {selected_port: port}, true),
                api('/rest/v1/rpc/qbox_list_products', {}, true),
                api('/rest/v1/rpc/qbox_list_plannings', {selected_port: port}, true)
            ]);
            if (sessionGeneration !== requestGeneration || sequence !== requestSequence || activeView !== 'planning' || port !== portSelect.value) return;
            if (!csbs.length || !products.length) throw new Error('Un CSB et un intrant sont nécessaires.');
            const plan = id ? plans.find(p => p.id === id && p.status === 'En cours') : null;
            if (id && !plan) throw new Error('Planning introuvable ou archivé : actualisez la liste.');
            if (!id && plans.some(p => p.status === 'En cours')) throw new Error('Un planning est déjà actif pour ce port.');
            if (plan && plan.items.some(item => !csbs.some(csb => csb.id === item.csb_id) ||
                !products.some(product => product.id === item.product_id)))
                throw new Error('Une référence du planning est introuvable : actualisez les données avant de le modifier.');
            planningCsbs = csbs;
            planningProducts = products;
            planningDraft = { id: plan?.id || crypto.randomUUID(), version: plan?.version ?? null, port };
            $('planning-form-main').reset();
            $('plan-observations').value = '';
            $('planning-observations-wrapper').hidden = !plan;
            $('plan-start').value = plan?.start_date || '';
            $('plan-end').value = plan?.end_date || '';
            $('plan-csb-blocks').replaceChildren();
            if (plan) {
                const grouped = new Map();
                for (const item of plan.items) {
                    if (!grouped.has(item.csb_id)) grouped.set(item.csb_id, []);
                    grouped.get(item.csb_id).push(item);
                }
                for (const [csbId, items] of grouped) addPlanningCsb(csbId, items);
            } else addPlanningCsb();
            setFormTitle('planning-modal-title', plan ? 'ph-pencil' : 'ph-calendar-plus', 'text-sky-600',
                plan ? 'Modifier la campagne' : 'Nouvelle campagne de planning');
            $('plan-submit-btn').textContent = plan ? 'Mettre à jour la campagne' : 'Enregistrer la campagne';
            $('postgres-plan-form-status').textContent = `Identifiant : ${planningDraft.id}`;
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-planning').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration && sequence === requestSequence && activeView === 'planning' && port === portSelect.value)
                $('postgres-planning-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) planningLoading = false; }
    }

    function closePlanning() {
        if (planningSaving) return;
        planningDraft = null;
        planningCsbs = [];
        planningProducts = [];
        $('plan-csb-blocks').replaceChildren();
        $('modal-planning').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitPlanning(event) {
        event.preventDefault();
        if (!planningDraft || planningSaving || !hasRole(['admin', 'logistics'])) return;
        const draft = planningDraft;
        const blocks = [...$('plan-csb-blocks').querySelectorAll('.planning-csb')];
        const rows = blocks.flatMap(block => [...block.querySelectorAll('.planning-item')].map(row => ({
            csb_id: block.querySelector('[name=csb]').value, product_id: row.querySelector('[name=product]').value,
            quantity: Number(row.querySelector('[name=quantity]').value)
        })));
        const start = $('plan-start').value, end = $('plan-end').value;
        if (draft.port !== portSelect.value || !start || !end || start > end || !rows.length || rows.length > 500 ||
            blocks.some(block => !block.querySelector('[name=csb]').value || !block.querySelectorAll('.planning-item').length) ||
            rows.some(row => !row.csb_id || !row.product_id || !Number.isSafeInteger(row.quantity) || row.quantity <= 0)) {
            $('postgres-plan-form-status').textContent = 'Vérifiez le port, les dates et les 1 à 500 lignes du planning.';
            return;
        }
        if (new Set(rows.map(row => `${row.csb_id}:${row.product_id}`)).size !== rows.length) {
            $('postgres-plan-form-status').textContent = 'Un intrant ne peut apparaître deux fois pour le même CSB.';
            return;
        }
        const requestGeneration = sessionGeneration;
        planningSaving = true;
        markFormLocked('planning-form-main');
        for (const control of $('planning-form-main').querySelectorAll('input, select, textarea, button')) control.disabled = true;
        $('planning-close').disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_save_planning', {
                planning_id: draft.id, selected_port: draft.port, expected_version: draft.version,
                start_date: start, end_date: end, items: rows, observations: $('plan-observations').value.trim() || null
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            planningSaving = false;
            closePlanning();
            if (frameConnected) sendFrame({type:'qbox-planning-changed', port:draft.port});
            await refreshPlanCards('planning');
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-planning-status').textContent += ' Campagne enregistrée.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-plan-form-status').textContent = `${error.message} Actualisez les plannings avant de recommencer après une interruption. Identifiant : ${draft.id}`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('planning-form-main');
                planningSaving = false;
                for (const control of $('planning-form-main').querySelectorAll('input, select, textarea, button')) control.disabled = false;
                $('planning-close').disabled = false;
            }
        }
    }

    async function openArchive() {
        if (!hasRole(['admin', 'logistics'])) {
            $('postgres-planning-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (planningLoading || planningSaving || !portSelect.value) return;
        const port = portSelect.value, requestGeneration = sessionGeneration, sequence = requestSequence;
        planningLoading = true;
        $('postgres-planning-status').textContent = 'Chargement de la campagne…';
        try {
            const plans = await api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true);
            if (sessionGeneration !== requestGeneration || sequence !== requestSequence || activeView !== 'planning' || port !== portSelect.value) return;
            const plan = plans.find(item => item.status === 'En cours');
            if (!plan) throw new Error('Aucun planning actif à archiver.');
            archiveDraft = {id: plan.id, version:plan.version, port, code:plan.code};
            $('archive-form-main').reset();
            $('postgres-archive-form-status').textContent = `Campagne : ${plan.code}`;
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-archive').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration && sequence === requestSequence && activeView === 'planning' && port === portSelect.value)
                $('postgres-planning-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) planningLoading = false; }
    }

    function closeArchive() {
        if (planningSaving) return;
        archiveDraft = null;
        $('modal-archive').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitArchive(event) {
        event.preventDefault();
        if (!archiveDraft || planningSaving || !hasRole(['admin', 'logistics'])) return;
        const draft = archiveDraft, folder = $('archive-folder-name').value.trim();
        if (!folder || draft.port !== portSelect.value) {
            $('postgres-archive-form-status').textContent = 'Vérifiez le port et le nom du dossier.';
            return;
        }
        if (!confirm(`Archiver la campagne ${draft.code} ?`)) return;
        const requestGeneration = sessionGeneration;
        planningSaving = true;
        markFormLocked('archive-form-main');
        for (const control of $('archive-form-main').querySelectorAll('input, button')) control.disabled = true;
        $('archive-close').disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_archive_planning', {
                planning_id:draft.id, selected_port:draft.port, expected_version:draft.version, folder_name:folder
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            planningSaving = false;
            closeArchive();
            if (frameConnected) sendFrame({type:'qbox-planning-changed', port:draft.port});
            await refreshPlanCards('planning');
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-planning-status').textContent += ' Campagne archivée.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('postgres-archive-form-status').textContent = `${error.message} Actualisez les plannings pour vérifier le résultat.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('archive-form-main');
                planningSaving = false;
                for (const control of $('archive-form-main').querySelectorAll('input, button')) control.disabled = false;
                $('archive-close').disabled = false;
            }
        }
    }

    async function refreshNativeView(view) {
        const port = portSelect.value;
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        const body = $(view === 'stocks' ? 'stocks-table-body' : 'salama-table-body');
        const notice = $(view === 'stocks' ? 'postgres-stocks-status' : 'postgres-salama-status');
        body.replaceChildren();
        if (view === 'stocks') stockRows = [];
        notice.textContent = port ? 'Chargement…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const data = await Promise.all(view === 'stocks'
                ? [api('/rest/v1/rpc/qbox_list_stocks', { selected_port: port }, true),
                    api('/rest/v1/rpc/qbox_list_products', {}, true)]
                : [api('/rest/v1/rpc/qbox_list_receipts', { selected_port: port }, true)]);
            if (seq !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            if (view === 'stocks') {
                const products = new Map(data[1].map(product => [product.id, product.code]));
                stockRows = data[0].map(row => ({ ...row, code: products.get(row.product_id) }));
                renderStocks();
            } else {
                for (const receipt of data[0]) {
                    const group = document.createElement('tr');
                    group.className = 'bg-slate-100';
                    const header = document.createElement('th');
                    header.colSpan = 6;
                    header.scope = 'rowgroup';
                    header.className = 'py-3 px-4 text-left text-xs text-slate-800';
                    const reference = document.createElement('span');
                    reference.className = 'font-mono font-bold';
                    reference.textContent = receipt.reference;
                    const count = document.createElement('span');
                    count.className = 'ml-2 font-normal text-slate-500';
                    count.textContent = `(${receipt.items.length} ligne(s) de réception)`;
                    header.append(reference, count);
                    group.append(header);
                    body.append(group);
                    for (const item of receipt.items) {
                        const row = tableRow([receipt.reference, localDateTime(receipt.received_at), item.name,
                            item.lot, number(item.quantity), 'Réception enregistrée']);
                        row.children[0].className += ' font-mono';
                        row.children[2].className += ' font-bold text-slate-900';
                        row.children[3].className += ' font-mono font-bold text-amber-900';
                        row.children[4].className += ' text-right font-mono font-bold';
                        row.children[5].className += ' text-center text-emerald-700 font-bold';
                        body.append(row);
                    }
                }
                if (!data[0].length) body.append(emptyTableRow('Aucune réception enregistrée.', 6));
            }
            notice.textContent = `Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (seq !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            body.replaceChildren();
            notice.textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    function addReceiptRow(products) {
        const row = document.createElement('div');
        row.className = 'salama-row p-3 border border-slate-200 rounded-xl space-y-3';
        for (const [labelText, name, type] of [
            ['Intrant', 'product', 'select'], ['N° de lot', 'lot', 'text'],
            ['Date de péremption', 'expiry', 'date'], ['Quantité', 'quantity', 'number']
        ]) {
            const label = document.createElement('label');
            label.className = 'block text-xs font-semibold text-slate-700';
            label.textContent = labelText;
            const input = document.createElement(type === 'select' ? 'select' : 'input');
            input.name = name;
            input.className = 'mt-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white';
            input.required = true;
            if (type === 'select') {
                input.add(new Option('Sélectionner un intrant', ''));
                for (const product of products) input.add(new Option(`${product.code} · ${product.name} · ${product.unit}`, product.id));
            } else {
                input.type = type;
                if (name === 'lot') input.maxLength = 120;
                if (name === 'quantity') { input.min = '1'; input.max = '9007199254740991'; input.step = '1'; }
            }
            label.append(input);
            row.append(label);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'text-xs font-bold text-red-600';
        remove.textContent = 'Retirer cet intrant';
        remove.addEventListener('click', () => row.remove());
        row.append(remove);
        $('salama-items').append(row);
    }

    let receiptProducts = [];
    async function openReceipt() {
        if (!hasRole(['admin', 'logistics'])) {
            $(activeView === 'stocks' ? 'postgres-stocks-status' : 'postgres-salama-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        if (!portSelect.value || receiptOpening || receiptSaving) return;
        const port = portSelect.value;
        const requestGeneration = sessionGeneration;
        receiptOpening = true;
        try {
            const products = await api('/rest/v1/rpc/qbox_list_products', {}, true);
            if (sessionGeneration !== requestGeneration || port !== portSelect.value || !['stocks', 'salama'].includes(activeView)) return;
            if (!products.length) throw new Error('Ajoutez au moins un intrant au catalogue avant une réception.');
            receiptProducts = products;
            receiptId = crypto.randomUUID();
            receiptPort = port;
            portSelect.disabled = true;
            $('salama-form').reset();
            $('salama-items').replaceChildren();
            $('postgres-salama-form-status').textContent = `Identifiant de réception : ${receiptId}`;
            addReceiptRow(products);
            $('modal-backdrop').classList.remove('hidden');
            $('modal-salama').classList.remove('hidden');
        } catch (error) {
            if (sessionGeneration === requestGeneration) $(activeView === 'stocks' ? 'postgres-stocks-status' : 'postgres-salama-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) receiptOpening = false; }
    }

    function closeReceipt() {
        if (receiptSaving) return;
        receiptId = null;
        receiptPort = null;
        receiptProducts = [];
        $('salama-items').replaceChildren();
        $('modal-salama').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitReceipt(event) {
        event.preventDefault();
        if (!receiptId || receiptSaving || !hasRole(['admin', 'logistics'])) return;
        const formStatus = $('postgres-salama-form-status');
        if (receiptPort !== portSelect.value) {
            formStatus.textContent = 'Le port a changé. Annulez et recommencez la réception pour le port sélectionné.';
            return;
        }
        const items = [...$('salama-items').querySelectorAll('.salama-row')].map(row => ({
            product_id: row.querySelector('[name=product]').value,
            lot: row.querySelector('[name=lot]').value.trim(),
            expiry_date: row.querySelector('[name=expiry]').value,
            quantity: Number(row.querySelector('[name=quantity]').value)
        }));
        const reference = $('salama-id').value.trim();
        if (!reference || !items.length || items.some(item => !item.product_id || !item.lot ||
            !item.expiry_date || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
            formStatus.textContent = 'Indiquez un bon et au moins un intrant, un lot, une date et une quantité valides.';
            return;
        }
        if (!confirm(`Enregistrer cette réception de ${items.length} ligne(s) pour le port sélectionné ?`)) return;
        const port = portSelect.value;
        const requestGeneration = sessionGeneration;
        const id = receiptId;
        receiptSaving = true;
        markFormLocked('salama-form');
        for (const control of $('salama-form').querySelectorAll('input, select, button')) control.disabled = true;
        $('salama-close').disabled = true;
        portSelect.disabled = true;
        try {
            await api('/rest/v1/rpc/qbox_receive_stock', {
                request_id: id, selected_port: port, receipt_reference: reference, items
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            receiptSaving = false;
            closeReceipt();
            if (frameConnected) sendFrame({ type: 'qbox-data-changed', port });
            if (['stocks', 'salama'].includes(activeView)) {
                await refreshNativeView(activeView);
                if (sessionGeneration !== requestGeneration) return;
                $(activeView === 'stocks' ? 'postgres-stocks-status' : 'postgres-salama-status').textContent += ' Réception enregistrée.';
            }
        } catch (error) {
            if (sessionGeneration === requestGeneration) formStatus.textContent = `${error.message} Vérifiez les réceptions avant toute nouvelle saisie en cas de perte de connexion. Identifiant : ${id}`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                unmarkFormLocked('salama-form');
                receiptSaving = false;
                for (const control of $('salama-form').querySelectorAll('input, select, button')) control.disabled = false;
                $('salama-close').disabled = false;
                portSelect.disabled = !!receiptId || activeView === 'operations';
            }
        }
    }

    const number = value => BigInt(value).toLocaleString('fr-FR');
    const items = rows => rows.map(item => `${item.name} · lot ${item.lot} : ${number(item.quantity)} ${item.unit}`);

    function renderDashboardExpirations(data) {
        const container = $('dash-expirations-list');
        container.replaceChildren();
        const lots = data.expirations || [];
        if (!lots.length) {
            addLine(container, 'Aucune alerte de péremption imminente.');
            return;
        }
        if (data.expiry_count > lots.length) {
            const count = document.createElement('p');
            count.className = 'px-3 pt-2 text-[10px] text-slate-500';
            count.textContent = `${lots.length} lots les plus proches affichés sur ${data.expiry_count} lots datés en stock.`;
            container.append(count);
        }
        for (const lot of lots) {
            const expired = lot.classification === 'expired';
            const soon = lot.classification === 'soon';
            const urgent = expired || soon;
            const row = document.createElement('div');
            row.className = 'p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors';
            const details = document.createElement('div');
            details.className = 'flex items-center space-x-3 min-w-0 pr-2';
            const icon = document.createElement('div');
            icon.className = `w-8 h-8 rounded-full ${expired ? 'bg-red-100 text-red-700' : soon ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center shrink-0`;
            const warning = document.createElement('i');
            warning.className = 'ph ph-warning';
            icon.append(warning);
            const info = document.createElement('div');
            info.className = 'min-w-0';
            const name = document.createElement('div');
            name.className = 'text-xs font-bold text-slate-900 truncate';
            name.textContent = lot.name;
            const balance = document.createElement('div');
            balance.className = 'text-[11px] text-slate-500 font-mono';
            balance.textContent = `Lot : ${lot.lot} · Stock : ${number(lot.quantity)} ${lot.unit} · Réservé : ${number(lot.reserved)} · Disponible : ${number(BigInt(lot.quantity) - BigInt(lot.reserved))}`;
            info.append(name, balance);
            details.append(icon, info);
            const expiry = document.createElement('div');
            expiry.className = 'text-right shrink-0';
            const date = document.createElement('span');
            date.className = `px-2.5 py-1 rounded border ${expired ? 'bg-red-50 text-red-700 border-red-200' : urgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'} font-mono font-bold text-[11px]`;
            date.textContent = `${expired ? 'Périmé' : soon ? 'Dans les 3 mois' : 'Plus de 3 mois'} · ${lot.expiry_date}`;
            expiry.append(date);
            row.append(details, expiry);
            container.append(row);
        }
    }

    function renderDashboardFlights(data) {
        const container = $('dash-missions-list');
        container.replaceChildren();
        const flights = data.flight_list || [];
        if (!flights.length) {
            addLine(container, 'Aucun colis en cours de livraison pour ce port.');
            return;
        }
        if (data.flights > flights.length) addLine(container, `${flights.length} colis récents sur ${data.flights}.`);
        for (const flight of flights) {
            const card = document.createElement('div');
            card.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3';
            const details = document.createElement('div');
            details.className = 'min-w-0 pr-2';
            const heading = document.createElement('div');
            heading.className = 'flex flex-wrap items-center gap-2';
            const bl = document.createElement('span');
            bl.className = 'font-mono font-bold text-xs text-slate-900';
            bl.textContent = flight.bl;
            const status = document.createElement('span');
            status.className = 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 text-cyan-800';
            status.textContent = 'En cours de livraison';
            heading.append(bl, status);
            const destination = document.createElement('div');
            destination.className = 'text-xs font-semibold text-slate-800 mt-1 truncate';
            const mapPin = document.createElement('i');
            mapPin.className = 'ph ph-map-pin text-slate-400 mr-1';
            const destinationName = document.createElement('span');
            destinationName.textContent = `${flight.csb} · planning ${flight.planning}`;
            destination.append(mapPin, destinationName);
            const cargo = document.createElement('div');
            cargo.className = 'text-[11px] text-slate-500 font-mono mt-0.5 break-words';
            cargo.textContent = items(flight.items || []).join(', ');
            details.append(heading, destination, cargo);
            card.append(details);
            if (flight.id && hasRole(['admin', 'pilot'])) {
                const close = document.createElement('button');
                close.type = 'button';
                close.className = 'px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0';
                close.textContent = 'Clôturer';
                close.addEventListener('click', () => openDeliveryClose('drones', flight.id, 'close', 'dashboard'));
                card.append(close);
            }
            container.append(card);
        }
    }

    function renderDashboardPlanning(plan) {
        const container = $('dash-plannings-table');
        container.replaceChildren();
        if (!plan) {
            addLine(container, 'Aucun planning prévisionnel actif. Créez-en un dans la section Planification.');
            return;
        }
        const planned = BigInt(plan.planned);
        const delivered = BigInt(plan.delivered);
        const inFlight = BigInt(plan.in_flight);
        const inTransit = BigInt(plan.in_transit);
        const effective = delivered + inFlight + inTransit;
        const remaining = planned > effective ? planned - effective : 0n;
        const percent = roundedProgress(effective, planned) ?? 0n;
        const complete = planned > 0n && effective >= planned;
        const widthOf = quantity => planned > 0n ? Number((quantity * 10000n / planned)) / 100 : 0;
        const displayedDelivered = delivered < planned ? delivered : planned;
        const displayedFlight = inFlight < planned - displayedDelivered ? inFlight : planned - displayedDelivered;
        const displayedTransit = inTransit < planned - displayedDelivered - displayedFlight
            ? inTransit : planned - displayedDelivered - displayedFlight;
        const card = document.createElement('div');
        card.className = 'p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3';
        const heading = document.createElement('div');
        heading.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2';
        const campaign = document.createElement('div');
        const title = document.createElement('span');
        title.className = 'font-bold text-xs text-slate-900';
        title.textContent = `${plan.code} · ${plan.start_date} au ${plan.end_date}`;
        const csbs = document.createElement('span');
        csbs.className = 'text-xs text-slate-500 ml-1.5';
        csbs.textContent = `· ${plan.csbs} CSB concerné(s)`;
        campaign.append(title, csbs);
        const summary = document.createElement('div');
        summary.className = 'flex flex-wrap items-center gap-2';
        const ratio = document.createElement('span');
        ratio.className = 'text-xs font-mono font-bold text-slate-700';
        ratio.textContent = `${number(effective)} / ${number(planned)} un. (${number(percent)}%)`;
        const badge = document.createElement('span');
        badge.className = `px-2 py-0.5 rounded text-[10px] font-bold ${complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`;
        badge.textContent = complete ? 'Complété' : 'En cours';
        summary.append(ratio, badge);
        heading.append(campaign, summary);
        const track = document.createElement('div');
        track.className = 'w-full bg-slate-200 rounded-full h-2 overflow-hidden flex';
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-label', `Avancement de ${plan.code}`);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(percent > 100n ? 100n : percent));
        for (const [amount, color, label] of [
            [displayedDelivered, 'bg-emerald-500', 'Livré'],
            [displayedFlight, 'bg-cyan-400', 'En vol'],
            [displayedTransit, 'bg-sky-600', 'Transit terrestre']
        ]) {
            const segment = document.createElement('div');
            segment.className = `${color} h-2`;
            segment.style.width = `${widthOf(amount)}%`;
            segment.title = `${label} : ${number(amount)}`;
            track.append(segment);
        }
        const breakdown = document.createElement('div');
        breakdown.className = 'flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] text-slate-500 font-mono';
        breakdown.textContent = `Livrées : ${number(delivered)} · En vol : ${number(inFlight)} · Transit terrestre : ${number(inTransit)} · Restant : ${number(remaining)}`;
        card.append(heading, track, breakdown);
        container.append(card);
    }

    function renderDashboardStockChart(stocks) {
        const message = $('stock-chart-message');
        const canvas = $('stockBarChart');
        const details = $('stock-chart-details-body');
        const scroll = $('stock-chart-scroll');
        const detailsPanel = $('stock-chart-details');
        if (dashboardStockChart) dashboardStockChart.destroy();
        dashboardStockChart = null;
        details.replaceChildren();
        const totals = new Map();
        for (const stock of stocks) {
            const current = totals.get(stock.product_id) || {
                id:stock.product_id, name:stock.name, unit:stock.unit, threshold:stock.min_threshold,
                quantity:0n, reserved:0n
            };
            current.quantity += BigInt(stock.quantity);
            current.reserved += BigInt(stock.reserved);
            totals.set(stock.product_id, current);
        }
        for (const stock of stocks) {
            const total = totals.get(stock.product_id);
            const available = total.quantity - total.reserved;
            details.append(tableRow([
                stock.name, stock.lot, stock.expiry_date || 'Non renseignée', number(stock.quantity),
                number(stock.reserved), number(stock.available), number(available),
                number(stock.min_threshold), stock.min_threshold <= 0 ? 'Seuil inconnu' :
                    available < BigInt(stock.min_threshold) ? 'Sous le seuil' :
                        available * 2n <= BigInt(stock.min_threshold) * 3n ? 'À surveiller' : 'Disponible'
            ]));
        }
        const rows = [...totals.values()].sort((a, b) => {
            const difference = (b.quantity - b.reserved) - (a.quantity - a.reserved);
            return difference > 0n ? 1 : difference < 0n ? -1 : a.name.localeCompare(b.name, 'fr');
        });
        if (!rows.length) {
            scroll.classList.add('hidden');
            detailsPanel.classList.add('hidden');
            message.textContent = 'Aucun intrant en stock pour ce port.';
            message.classList.remove('hidden');
            return;
        }
        detailsPanel.classList.remove('hidden');
        if (typeof window.Chart !== 'function') {
            scroll.classList.add('hidden');
            message.textContent = 'Graphique indisponible : Chart.js n’est pas chargé. Consultez le tableau des lots ci-dessous.';
            message.classList.remove('hidden');
            return;
        }
        const colors = rows.map(row => row.threshold <= 0 ? '#64748b'
            : row.quantity - row.reserved < BigInt(row.threshold) ? '#e11d48'
                : (row.quantity - row.reserved) * 2n <= BigInt(row.threshold) * 3n ? '#d97706' : '#059669');
        $('stock-chart-container').style.height = `${Math.max(260, rows.length * 45 + 40)}px`;
        dashboardStockChart = new window.Chart(canvas, {
            type:'bar',
            data:{labels:rows.map(row => row.name), datasets:[{
                label:'Disponible', data:rows.map(row => Number(row.quantity - row.reserved)), backgroundColor:colors,
                borderRadius:6, maxBarThickness:22
            }]},
            options:{responsive:true, maintainAspectRatio:false, indexAxis:'y', animation:false,
                layout:{padding:{right:80}},
                plugins:{legend:{display:false}, tooltip:{callbacks:{label:context => {
                    const row = rows[context.dataIndex];
                    return [`Disponible : ${number(row.quantity - row.reserved)} ${row.unit}`,
                        `Réservé aux vols : ${number(row.reserved)} ${row.unit}`,
                        `Seuil produit : ${row.threshold > 0 ? number(row.threshold) : 'Non défini'}`];
                }}}},
                scales:{
                    x:{beginAtZero:true, grace:'5%', grid:{color:'#e2e8f0'},
                        border:{display:false}, ticks:{color:'#64748b', font:{family:'Inter',size:10}, callback:value => Number(value).toLocaleString('fr-FR')}},
                    y:{grid:{display:false}, border:{display:false}, ticks:{color:'#334155', font:{family:'Inter',size:11,weight:'600'},
                        callback:function(value) { const label = this.getLabelForValue(value); return label.length > 26 ? `${label.slice(0, 25)}…` : label; }}}
                }},
            plugins:[{
                id:'dashboardStockValues',
                afterDatasetsDraw(chart) {
                    const {ctx, chartArea} = chart;
                    ctx.save();
                    ctx.font = '600 11px Inter, sans-serif';
                    ctx.fillStyle = '#334155';
                    ctx.textBaseline = 'middle';
                    chart.getDatasetMeta(0).data.forEach((bar, index) => {
                        ctx.fillText(number(rows[index].quantity - rows[index].reserved),
                            Math.min(bar.x + 7, chartArea.right + 7), bar.y, 70);
                    });
                    ctx.restore();
                }
            }]
        });
        scroll.classList.remove('hidden');
        const approximate = rows.some(row => row.quantity - row.reserved > BigInt(Number.MAX_SAFE_INTEGER));
        message.textContent = approximate ? 'Les quantités très élevées peuvent être arrondies dans le graphique ; consultez le tableau pour les valeurs exactes.' : '';
        message.classList.toggle('hidden', !approximate);
    }

    function renderDashboard(data) {
        const stock = BigInt(data.stock), reserved = BigInt(data.reserved);
        setText('dash-total-stock', number(stock - reserved));
        setText('dash-active-drones', data.flights);
        setText('dash-active-plannings', data.planning ? '1' : '0');
        setText('dash-total-csb', data.csbs);
        const plan = data.planning;
        const planned = plan ? BigInt(plan.planned) : 0n;
        const delivered = plan ? BigInt(plan.delivered) : 0n;
        const rate = roundedProgress(delivered, planned);
        setText('dash-global-rate', rate === null ? 'N/A' : `${rate} %`);
        setText('dash-global-ratio', `${number(delivered)} / ${number(planned)}`);
        const width = planned > 0n ? (delivered >= planned ? 10000n : (delivered * 10000n + planned / 2n) / planned) : 0n;
        $('dash-global-bar').style.width = `${Number(width) / 100}%`;
        renderDashboardFlights(data);
        renderDashboardPlanning(plan);
        renderDashboardExpirations(data);
    }

    async function refreshDashboard() {
        const port = portSelect.value;
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        clearDashboard();
        setText('active-port-badge', portSelect.selectedOptions[0]?.textContent || 'Aucun port');
        $('postgres-dashboard-status').textContent = port ? 'Chargement du tableau de bord…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const result = await api('/rest/v1/rpc/qbox_dashboard_details', { selected_port: port }, true);
            if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            renderDashboard(result);
            try {
                const stocks = await api('/rest/v1/rpc/qbox_dashboard_stock_chart_exact', {selected_port:port}, true);
                if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
                renderDashboardStockChart(stocks);
            } catch (error) {
                if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
                $('stock-chart-scroll').classList.add('hidden');
                $('stock-chart-details').classList.add('hidden');
                $('stock-chart-message').textContent = `Graphique des stocks indisponible : ${error.message}`;
                $('stock-chart-message').classList.remove('hidden');
            }
            $('postgres-dashboard-status').textContent = `Actualisé le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (heure de Madagascar).`;
            if (isStorage()) {
                $('dashboard-storage-transfers').replaceChildren();
                try {
                    const transfers = await api('/rest/v1/rpc/qbox_list_stock_transfers', {selected_port:port}, true);
                    if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
                    if (!transfers.length) addLine($('dashboard-storage-transfers'), 'Aucune opération enregistrée.');
                    for (const transfer of transfers.slice(0, 5))
                        addLine($('dashboard-storage-transfers'), `${transfer.reference} · ${transfer.source_name} → ${transfer.destination_name} · ${localDateTime(transfer.created_at)}`);
                } catch (error) {
                    if (seq === requestSequence && activeView === 'dashboard' && port === portSelect.value && sessionGeneration === requestGeneration && token)
                        $('dashboard-storage-transfers').textContent = `Opérations indisponibles : ${error.message}`;
                }
            }
        } catch (error) {
            if (seq !== requestSequence || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            clearDashboard();
            $('postgres-dashboard-status').textContent = `Tableau de bord indisponible : ${error.message}`;
        }
    }

    async function openPostgresDashboardReport() {
        if (dashboardReportPort || activeView !== 'dashboard' || !portSelect.value) return;
        const port = portSelect.value, sequence = ++dashboardReportSequence, request = requestSequence, requestGeneration = sessionGeneration;
        $('postgres-dashboard-status').textContent = 'Chargement du rapport…';
        try {
            const data = await api('/rest/v1/rpc/qbox_dashboard_report', {selected_port:port}, true);
            if (sequence !== dashboardReportSequence || request !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            if (!data) throw new Error('Aucun planning actif pour ce port.');
            $('dashboard-report').replaceChildren();
            renderDashboardReport(data, $('dashboard-report'));
            dashboardReportPort = port;
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('report-preview-modal').classList.remove('hidden');
            $('postgres-dashboard-status').textContent = 'Rapport chargé ; il sera actualisé avant impression.';
        } catch (error) {
            if (sequence === dashboardReportSequence && request === requestSequence && activeView === 'dashboard' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-dashboard-status').textContent = `Rapport indisponible : ${error.message}`;
        }
    }

    function closePostgresDashboardReport() {
        dashboardReportSequence++;
        dashboardReportPort = null;
        $('report-preview-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('dashboard-report').replaceChildren();
        document.body.classList.remove('report-print-mode');
        portSelect.disabled = false;
    }

    async function printPostgresDashboardReport() {
        const port = dashboardReportPort;
        if (!port || port !== portSelect.value) return;
        const sequence = ++dashboardReportSequence, requestGeneration = sessionGeneration;
        $('dashboard-report-print').disabled = true;
        try {
            const data = await api('/rest/v1/rpc/qbox_dashboard_report', {selected_port:port}, true);
            if (sequence !== dashboardReportSequence || dashboardReportPort !== port || sessionGeneration !== requestGeneration || port !== portSelect.value) return;
            if (!data) throw new Error('Aucun planning actif pour ce port.');
            $('dashboard-report').replaceChildren();
            renderDashboardReport(data, $('dashboard-report'));
            document.body.classList.add('report-print-mode');
            window.print();
        } catch (error) {
            if (sequence === dashboardReportSequence && sessionGeneration === requestGeneration) {
                closePostgresDashboardReport();
                $('postgres-dashboard-status').textContent = `Impression impossible : ${error.message}`;
            }
        } finally { if (sessionGeneration === requestGeneration) $('dashboard-report-print').disabled = false; }
    }

    async function refreshReadView() {
        const view = activeView;
        const spec = readViews[view];
        const port = portSelect.value;
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        const content = $('postgres-read-content');
        content.replaceChildren();
        $('postgres-read-status').textContent = 'Chargement…';
        setText('active-port-badge', portSelect.selectedOptions[0]?.textContent || 'Aucun port');
        if (spec.port && !port) {
            $('postgres-read-status').textContent = 'Aucun port disponible.';
            return;
        }
        try {
            const result = await api(`/rest/v1/rpc/${spec.rpc}`, spec.port ? { selected_port: port } : {}, true);
            if (seq !== requestSequence || view !== activeView || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            const rows = spec.filter ? result.filter(spec.filter) : result;
            if (!rows.length) addLine(content, 'Aucune donnée.');
            else {
                const table = document.createElement('table');
                table.className = 'postgres-read-table';
                const header = document.createElement('thead');
                const heading = document.createElement('tr');
                for (const name of spec.columns) {
                    const cell = document.createElement('th');
                    cell.scope = 'col';
                    cell.textContent = name;
                    heading.append(cell);
                }
                header.append(heading);
                const body = document.createElement('tbody');
                for (const item of rows) {
                    const tr = document.createElement('tr');
                    for (const value of spec.row(item)) {
                        const cell = document.createElement('td');
                        cell.textContent = value;
                        tr.append(cell);
                    }
                    body.append(tr);
                }
                table.append(header, body);
                content.append(table);
            }
            $('postgres-read-status').textContent = `${rows.length} ligne(s) · Actualisé le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (heure de Madagascar).`;
        } catch (error) {
            if (seq !== requestSequence || view !== activeView || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            content.replaceChildren();
            $('postgres-read-status').textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    function selectView(view) {
        if (transferSaving) {
            $('transfer-status').textContent = 'Patientez pendant l’enregistrement de l’expédition.';
            return;
        }
        if (isStorage() && ['planning', 'archives', 'drones', 'history', 'sorties', 'csb'].includes(view)) view = 'dashboard';
        if (deliveryPrintDraft) { closeDeliveryPrint(); }
        if (planningPrintDraft) { closePlanningPrint(); }
        if (stockHistoryPrintOpen) { closeStockHistoryPrint(); }
        if (dashboardReportPort) { closePostgresDashboardReport(); }
        if (inventoryPrintDraft) { closeInventoryPrint(); }
        if (receiptId || productOpen || productSaving || csbOpen || csbSaving || portFormOpen || portSaving || planningDraft || archiveDraft || planningSaving || flightDraft || flightSaving || shipmentDraft || shipmentSaving || inventoryDraft || inventorySaving || quarantineDraft || quarantineSaving || deliveryCloseDraft || deliveryCloseSaving || deliveryEditDraft || deliveryEditSaving) {
            $(receiptId ? 'postgres-salama-form-status' : csbOpen ? 'postgres-csb-form-status' : (portFormOpen || portSaving) ? 'postgres-ports-status' : planningDraft ? 'postgres-plan-form-status' : archiveDraft ? 'postgres-archive-form-status' : flightDraft ? 'postgres-drone-form-status' : shipmentDraft ? 'postgres-sortie-form-status' : inventoryDraft ? 'postgres-inventory-status' : (quarantineDraft || quarantineSaving) ? 'postgres-quarantine-status' : deliveryCloseDraft ? 'postgres-close-delivery-status' : deliveryEditDraft ? 'delivery-edit-status' : 'postgres-product-form-status').textContent = 'Terminez ou annulez la saisie avant de changer de page.';
            return;
        }
        activeView = view;
        const dashboard = view === 'dashboard';
        const native = nativeViewIds.includes(view);
        for (const id of nativeViewIds) $(`view-${id}`).classList.toggle('hidden', view !== id);
        $('view-dashboard').classList.toggle('postgres-hidden', !dashboard);
        $('postgres-read-view').classList.toggle('postgres-hidden', dashboard || native);
        $('postgres-operations-view').classList.add('postgres-hidden');
        portSelect.disabled = false;
        setText('page-title', dashboard ? 'Tableau de Bord de Supervision' : readViews[view].title);
        if (!dashboard) setText('postgres-read-title', readViews[view].title);
        for (const button of document.querySelectorAll('.nav-item')) {
            button.classList.toggle('bg-amber-400', button.id === `nav-${view}`);
            button.classList.toggle('text-slate-950', button.id === `nav-${view}`);
            if (button.id === `nav-${view}`) {
                const group = button.closest('.sidebar-group');
                if (group) group.open = true;
            }
        }
        if (dashboard) refreshDashboard(); else if (view === 'transfers') refreshTransfers(); else if (view === 'products') refreshCatalog(); else if (view === 'csb') refreshCsbs(); else if (view === 'ports') refreshPorts(); else if (['planning', 'archives'].includes(view)) refreshPlanCards(view); else if (['drones', 'history', 'sorties'].includes(view)) refreshDeliveries(view); else if (view === 'inventory') refreshInventories(); else if (view === 'quarantine') refreshQuarantines(); else if (view === 'stock-history') refreshStockHistory(); else if (view === 'logistics-report') refreshLogisticsReport(); else if (native) refreshNativeView(view); else refreshReadView();
    }

    const operationSections = {
        stocks: 'stock-test', salama: 'stock-test', products: 'catalog', csb: 'references', ports: 'references',
        planning: 'planning-test', archives: 'planning-test', drones: 'flight-test', history: 'flight-test',
        sorties: 'shipment-test', quarantine: 'quarantine-test', inventory: 'inventory-test',
        'stock-history': 'stock-history-test', dashboard: 'dashboard-test', 'admin-postgres': 'administration'
    };

    function sendFrame(data) {
        if (frame?.contentWindow) frame.contentWindow.postMessage(data, location.origin);
    }

    function openOperations(section) {
        if (section === 'flight-test' && userRole !== 'admin') {
            $(`postgres-${activeView === 'history' ? 'history' : 'drones'}-status`).textContent =
                'Ce panneau est réservé aux administrateurs.';
            return;
        }
        if (transferSaving) {
            $('transfer-status').textContent = 'Patientez pendant l’enregistrement de l’expédition.';
            return;
        }
        if (deliveryPrintDraft) { closeDeliveryPrint(); }
        if (planningPrintDraft) { closePlanningPrint(); }
        if (stockHistoryPrintOpen) { closeStockHistoryPrint(); }
        if (dashboardReportPort) { closePostgresDashboardReport(); }
        if (inventoryPrintDraft) { closeInventoryPrint(); }
        if (receiptId || productOpen || productSaving || csbOpen || csbSaving || portFormOpen || portSaving || planningDraft || archiveDraft || planningSaving || flightDraft || flightSaving || shipmentDraft || shipmentSaving || inventoryDraft || inventorySaving || quarantineDraft || quarantineSaving || deliveryCloseDraft || deliveryCloseSaving || deliveryEditDraft || deliveryEditSaving) {
            $(receiptId ? 'postgres-salama-form-status' : csbOpen ? 'postgres-csb-form-status' : (portFormOpen || portSaving) ? 'postgres-ports-status' : planningDraft ? 'postgres-plan-form-status' : archiveDraft ? 'postgres-archive-form-status' : flightDraft ? 'postgres-drone-form-status' : shipmentDraft ? 'postgres-sortie-form-status' : inventoryDraft ? 'postgres-inventory-status' : (quarantineDraft || quarantineSaving) ? 'postgres-quarantine-status' : deliveryCloseDraft ? 'postgres-close-delivery-status' : deliveryEditDraft ? 'delivery-edit-status' : 'postgres-product-form-status').textContent = 'Terminez ou annulez la saisie avant de changer de page.';
            return;
        }
        if (!Object.values(operationSections).includes(section)) return;
        requestSequence++;
        activeView = 'operations';
        operationSection = section;
        $('view-dashboard').classList.add('postgres-hidden');
        $('postgres-read-view').classList.add('postgres-hidden');
        for (const id of nativeViewIds) $(`view-${id}`).classList.add('hidden');
        $('postgres-operations-view').classList.remove('postgres-hidden');
        const accounts = section === 'administration';
        $('page-title').textContent = accounts ? 'Gestion des comptes' : 'Opérations PostgreSQL locales';
        $('postgres-operations-notice').classList.toggle('postgres-hidden', accounts);
        if (accounts) {
            for (const button of document.querySelectorAll('.nav-item')) {
                button.classList.toggle('bg-amber-400', button.id === 'nav-admin-postgres');
                button.classList.toggle('text-slate-950', button.id === 'nav-admin-postgres');
                if (button.id === 'nav-admin-postgres') {
                    const group = button.closest('.sidebar-group');
                    if (group) group.open = true;
                }
            }
        }
        portSelect.disabled = true;
        if (!frame) {
            frame = document.createElement('iframe');
            frame.title = 'Opérations PostgreSQL locales';
            frame.src = 'admin-local.html?embedded=1';
            $('postgres-operations-status').textContent = 'Chargement des opérations…';
            $('postgres-frame-container').append(frame);
        } else {
            sendFrame({ type: 'qbox-embed-section', section });
        }
    }

    window.addEventListener('message', async event => {
        if (event.origin !== location.origin || !frame || event.source !== frame.contentWindow || !event.data) return;
        const data = event.data;
        if (data.type === 'qbox-embed-ready' && token) {
            const requestGeneration = sessionGeneration;
            try {
                if (refreshToken && tokenExpiresAt && tokenExpiresAt <= Date.now() + 30000) await refreshSession();
            } catch (error) {
                if (token && sessionGeneration === requestGeneration && frame && event.source === frame.contentWindow)
                    $('postgres-operations-status').textContent = `Renouvellement de session impossible : ${error.message}`;
                return;
            }
            if (sessionGeneration !== requestGeneration || !frame || event.source !== frame.contentWindow || !token) return;
            sendFrame({ type: 'qbox-embed-init', token, port: portSelect.value });
            sendFrame({ type: 'qbox-embed-section', section: operationSection });
        } else if (data.type === 'qbox-embed-connected') {
            frameConnected = true;
            $('postgres-operations-status').textContent = '';
            sendFrame({ type: 'qbox-embed-section', section: operationSection });
        } else if (data.type === 'qbox-embed-error') {
            $('postgres-operations-status').textContent = `Opérations indisponibles : ${data.error}`;
        } else if (data.type === 'qbox-session-expired' || data.type === 'qbox-session-ended') {
            if (typeof data.token === 'string' && data.token !== token) return;
            showLogin();
            status.textContent = 'Session terminée ou expirée : reconnectez-vous.';
        } else if (data.type === 'qbox-port-changed' && typeof data.port === 'string' && Array.isArray(data.ports)) {
            const requestGeneration = sessionGeneration;
            let ports;
            try {
                ports = await api('/rest/v1/rpc/qbox_list_warehouses', {}, true);
            } catch (error) {
                if (sessionGeneration === requestGeneration && frame && event.source === frame.contentWindow)
                    $('postgres-operations-status').textContent = `Actualisation des magasins impossible : ${error.message}`;
                return;
            }
            if (sessionGeneration !== requestGeneration || !frame || event.source !== frame.contentWindow) return;
            warehouseRows = ports;
            portSelect.replaceChildren();
            for (const port of warehouseRows) {
                if (typeof port.id === 'string' && typeof port.name === 'string' && typeof port.region === 'string')
                    portSelect.add(new Option(`${port.name} · ${port.region}`, port.id));
            }
            portSelect.value = data.port;
            updateSiteNavigation();
            if (isStorage() && ['planning', 'archives', 'drones', 'history', 'sorties', 'csb'].includes(activeView)) {
                selectView('dashboard');
                return;
            }
            setText('active-port-badge', portSelect.selectedOptions[0]?.textContent || 'Aucun port');
            if (activeView === 'dashboard') refreshDashboard();
            else if (activeView === 'products') refreshCatalog();
            else if (activeView === 'csb') refreshCsbs();
            else if (activeView === 'ports') refreshPorts();
            else if (['planning', 'archives'].includes(activeView)) refreshPlanCards(activeView);
            else if (['drones', 'history', 'sorties'].includes(activeView)) refreshDeliveries(activeView);
            else if (activeView === 'inventory') refreshInventories();
            else if (activeView === 'quarantine') refreshQuarantines();
            else if (activeView === 'stock-history') refreshStockHistory();
            else if (activeView === 'logistics-report') refreshLogisticsReport();
            else if (['stocks', 'salama'].includes(activeView)) refreshNativeView(activeView);
            else if (readViews[activeView]) refreshReadView();
        }
    });

    function setup() {
        $('demo-profiles').classList.add('postgres-hidden');
        $('demo-login-options').classList.add('postgres-hidden');
        $('postgres-signup-link').classList.remove('postgres-hidden');
        for (const id of ['legacy-header-actions', 'legacy-dashboard-report'])
            $(id).classList.add('postgres-hidden');
        $('legacy-new-flight').removeAttribute('onclick');
        $('legacy-new-flight').addEventListener('click', () => {
            selectView('drones');
            openFlights();
        });
        $('legacy-new-receipt').removeAttribute('onclick');
        $('legacy-new-receipt').addEventListener('click', () => {
            selectView('salama');
            openReceipt();
        });
        for (const button of document.querySelectorAll('.nav-item')) {
            button.removeAttribute('onclick');
            const view = button.id.slice(4);
            if (view === 'dashboard' || readViews[view]) {
                button.addEventListener('click', () => selectView(view));
            } else if (view === 'stock-history') {
                button.addEventListener('click', () => openOperations(operationSections[view]));
            } else if (view === 'admin-postgres') {
                button.addEventListener('click', () => openOperations(operationSections[view]));
            } else {
                button.disabled = true;
                button.title = "Section non encore raccordée dans cette interface.";
            }
        }
        $('nav-transfers').classList.remove('postgres-hidden');
        $('nav-logistics-report').classList.remove('postgres-hidden');
        const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Indian/Antananarivo' }).format(new Date()));
        for (let year = currentYear; year >= 2000; year--) $('logistics-report-year').add(new Option(String(year), String(year)));
        $('logistics-report-year').value = String(currentYear);
        $('logistics-report-year').addEventListener('change', refreshLogisticsReport);
        $('logistics-report-refresh').addEventListener('click', refreshLogisticsReport);
        $('logistics-report-print').addEventListener('click', printLogisticsReport);
        $('port-type-field').classList.remove('postgres-hidden');
        $('transfer-form').addEventListener('submit', submitTransfer);
        $('transfer-add').addEventListener('click', addTransferItem);
        $('transfer-destination').addEventListener('change', transferDestinationChanged);
        $('dashboard-storage-link').addEventListener('click', () => selectView('transfers'));
        setText('auth-network-status', 'Version 2');
        setText('auth-version', 'TEST LOCAL');
        setText('dashboard-live-label', 'Instantané');
        setText('dashboard-fefo-label', 'Lots datés par péremption');
        $('login-username').value = '';
        $('login-password').value = '';
        $('login-username').type = 'email';
        $('login-username').autocomplete = 'username';
        $('login-password').autocomplete = 'current-password';
        for (const id of ['stocks-receive', 'salama-receive', 'salama-close', 'salama-cancel', 'salama-add-row'])
            $(id).removeAttribute('onclick');
        $('stock-search').removeAttribute('oninput');
        $('salama-form').removeAttribute('onsubmit');
        $('modal-backdrop').removeAttribute('onclick');
        for (const id of ['stocks-receive', 'salama-receive']) $(id).addEventListener('click', openReceipt);
        for (const id of ['salama-close', 'salama-cancel']) $(id).addEventListener('click', closeReceipt);
        $('modal-backdrop').addEventListener('click', () => { if (productOpen) closeProduct(); else if (csbOpen) closeCsb(); else if (planningDraft) closePlanning(); else if (archiveDraft) closeArchive(); else if (flightDraft) closeFlights(); else if (shipmentDraft) closeShipment(); else if (deliveryCloseDraft) closeDeliveryModal(); else if (deliveryEditDraft) closeDeliveryEdit(); else if (deliveryPrintDraft) closeDeliveryPrint(); else if (planningPrintDraft) closePlanningPrint(); else if (stockHistoryPrintOpen) closeStockHistoryPrint(); else if (dashboardReportPort) closePostgresDashboardReport(); else if (inventoryPrintDraft) closeInventoryPrint(); else closeReceipt(); });
        $('salama-add-row').addEventListener('click', () => addReceiptRow(receiptProducts));
        $('salama-form').addEventListener('submit', submitReceipt);
        $('stock-search').addEventListener('input', renderStocks);
        for (const id of ['postgres-stocks-status', 'postgres-salama-status', 'postgres-salama-form-status']) $(id).classList.remove('postgres-hidden');
        for (const id of ['postgres-stocks-refresh', 'postgres-salama-refresh']) {
            $(id).classList.remove('postgres-hidden');
            $(id).addEventListener('click', () => refreshNativeView(activeView));
        }
        $('salama-id').maxLength = 150;
        setText('stocks-quantity-heading', 'Stock enregistré');
        setText('stocks-status-heading', 'Réservé / Disponible');
        setText('stocks-fefo-description', 'Lots classés par intrant et date de péremption ; le choix du lot reste manuel.');
        setText('salama-description', 'Chaque réception enregistrée est affichée séparément ; les références peuvent être identiques.');
        for (const id of ['catalog-new', 'product-close', 'product-cancel']) $(id).removeAttribute('onclick');
        $('catalog-search').removeAttribute('oninput');
        $('form-product').removeAttribute('onsubmit');
        $('catalog-new').addEventListener('click', () => openProduct());
        for (const id of ['product-close', 'product-cancel']) $(id).addEventListener('click', closeProduct);
        $('form-product').addEventListener('submit', submitProduct);
        $('catalog-search').addEventListener('input', renderCatalog);
        $('postgres-products-refresh').addEventListener('click', refreshCatalog);
        for (const id of ['postgres-products-refresh', 'postgres-products-status', 'postgres-product-form-status']) $(id).classList.remove('postgres-hidden');
        $('product-name').maxLength = 150;
        $('product-unit').maxLength = 120;
        $('product-min-threshold').max = '9007199254740991';
        for (const id of ['csb-new', 'csb-close', 'csb-cancel']) $(id).removeAttribute('onclick');
        $('form-csb').removeAttribute('onsubmit');
        $('csb-region').removeAttribute('onchange');
        $('csb-new').addEventListener('click', () => openCsb());
        for (const id of ['csb-close', 'csb-cancel']) $(id).addEventListener('click', closeCsb);
        $('form-csb').addEventListener('submit', submitCsb);
        $('csb-region').addEventListener('change', () => updateCsbDistricts());
        $('postgres-csb-refresh').addEventListener('click', refreshCsbs);
        for (const id of ['postgres-csb-refresh', 'postgres-csb-status', 'postgres-csb-form-status']) $(id).classList.remove('postgres-hidden');
        $('csb-code').readOnly = true;
        $('csb-name').maxLength = 150;
        $('csb-dist').min = '0';
        $('csb-dist').max = '99999999.99';
        $('csb-dist').step = '0.01';
        $('legacy-reset-data').classList.add('postgres-hidden');
        for (const id of ['port-new', 'port-cancel']) $(id).removeAttribute('onclick');
        $('port-form').removeAttribute('onsubmit');
        $('port-new').addEventListener('click', () => openPort());
        $('port-cancel').addEventListener('click', closePort);
        $('port-form').addEventListener('submit', submitPort);
        $('postgres-ports-refresh').addEventListener('click', refreshPorts);
        for (const id of ['postgres-ports-refresh', 'postgres-ports-status']) $(id).classList.remove('postgres-hidden');
        for (const id of ['planning-archive', 'planning-new', 'planning-close', 'planning-cancel', 'planning-add', 'archive-close', 'archive-cancel']) $(id).removeAttribute('onclick');
        $('planning-form-main').removeAttribute('onsubmit');
        $('archive-form-main').removeAttribute('onsubmit');
        $('planning-new').addEventListener('click', () => openPlanning());
        $('planning-archive').addEventListener('click', openArchive);
        for (const id of ['planning-close', 'planning-cancel']) $(id).addEventListener('click', closePlanning);
        for (const id of ['archive-close', 'archive-cancel']) $(id).addEventListener('click', closeArchive);
        $('planning-add').addEventListener('click', () => addPlanningCsb());
        $('planning-add').textContent = 'Ajouter un CSB';
        $('planning-form-main').addEventListener('submit', submitPlanning);
        $('archive-form-main').addEventListener('submit', submitArchive);
        $('archive-folder-name').maxLength = 150;
        for (const id of ['postgres-planning-status', 'postgres-archives-status', 'postgres-plan-form-status', 'postgres-archive-form-status']) $(id).classList.remove('postgres-hidden');
        for (const view of ['planning', 'archives']) {
            const actions = document.createElement('div');
            actions.className = 'flex gap-2';
            const refresh = document.createElement('button');
            refresh.type = 'button';
            refresh.textContent = 'Actualiser';
            refresh.className = 'px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold';
            refresh.addEventListener('click', () => refreshPlanCards(view));
            const manage = document.createElement('button');
            manage.type = 'button';
            manage.textContent = 'Ouvrir les opérations et impressions';
            manage.className = 'px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold postgres-admin-flight-operations postgres-hidden';
            manage.addEventListener('click', () => openOperations(operationSections.planning));
            actions.append(refresh, manage);
            $(`postgres-${view}-status`).before(actions);
        }
        for (const id of ['drone-new', 'drone-close', 'drone-cancel', 'drone-add']) $(id).removeAttribute('onclick');
        $('drone-form-main').removeAttribute('onsubmit');
        $('drone-plan').removeAttribute('onchange');
        $('drone-target').removeAttribute('onchange');
        $('drone-new').addEventListener('click', openFlights);
        for (const id of ['drone-close', 'drone-cancel']) $(id).addEventListener('click', closeFlights);
        $('drone-add').addEventListener('click', addFlightParcel);
        $('drone-plan').addEventListener('change', () => {
            if (!flightDraft) return;
            if (!confirm('Changer le planning effacera les colis en cours de saisie. Continuer ?')) {
                $('drone-plan').value = flightDraft.plan;
                return;
            }
            setFlightTarget();
        });
        $('drone-target').addEventListener('change', () => {
            if (!flightDraft) return;
            if (!confirm('Changer le CSB effacera les colis en cours de saisie. Continuer ?')) {
                $('drone-target').value = flightDraft.target;
                return;
            }
            flightDraft.target = $('drone-target').value;
            $('drone-flights-container').replaceChildren();
            if (flightDraft.target) addFlightParcel();
            updateFlightNeeds();
        });
        $('drone-form-main').addEventListener('submit', submitFlights);
        $('postgres-drone-form-status').classList.remove('postgres-hidden');
        for (const id of ['sortie-new', 'sortie-close', 'sortie-cancel', 'sortie-add']) $(id).removeAttribute('onclick');
        $('sortie-form-main').removeAttribute('onsubmit');
        $('sortie-plan').removeAttribute('onchange');
        $('sortie-new').addEventListener('click', openShipment);
        for (const id of ['sortie-close', 'sortie-cancel']) $(id).addEventListener('click', closeShipment);
        $('sortie-add').addEventListener('click', addShipmentItem);
        $('sortie-plan').addEventListener('change', () => {
            if (!shipmentDraft) return;
            if (!confirm('Changer le planning effacera les intrants en cours de saisie. Continuer ?')) {
                $('sortie-plan').value = shipmentDraft.plan;
                return;
            }
            setShipmentTarget();
        });
        $('sortie-target').addEventListener('change', () => {
            if (!shipmentDraft) return;
            if (!confirm('Changer le CSB effacera les intrants en cours de saisie. Continuer ?')) {
                $('sortie-target').value = shipmentDraft.target;
                return;
            }
            shipmentDraft.target = $('sortie-target').value;
            $('sortie-items').replaceChildren();
            if (shipmentDraft.target) addShipmentItem();
            updateShipmentNeeds();
        });
        $('sortie-form-main').addEventListener('submit', submitShipment);
        for (const id of ['postgres-sortie-form-status', 'postgres-sortie-needs']) $(id).classList.remove('postgres-hidden');
        for (const id of ['inventory-new', 'inventory-cancel']) $(id).removeAttribute('onclick');
        $('inventory-form').removeAttribute('onsubmit');
        $('inventory-new').addEventListener('click', openInventory);
        $('inventory-cancel').addEventListener('click', closeInventory);
        $('inventory-form').addEventListener('submit', submitInventory);
        $('postgres-inventory-status').classList.remove('postgres-hidden');
        const inventoryActions = document.createElement('div');
        inventoryActions.className = 'flex gap-2';
        const inventoryRefresh = document.createElement('button');
        inventoryRefresh.type = 'button';
        inventoryRefresh.className = 'px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold';
        inventoryRefresh.textContent = 'Actualiser l’historique';
        inventoryRefresh.addEventListener('click', refreshInventories);
        const inventoryPrint = document.createElement('button');
        inventoryPrint.type = 'button';
        inventoryPrint.className = 'px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold postgres-admin-flight-operations postgres-hidden';
        inventoryPrint.textContent = 'Ouvrir les rapports imprimables';
        inventoryPrint.addEventListener('click', () => openOperations(operationSections.inventory));
        inventoryActions.append(inventoryRefresh, inventoryPrint);
        $('postgres-inventory-status').before(inventoryActions);
        $('quarantine-form-main').removeAttribute('onsubmit');
        $('quarantine-quantity').max = '9007199254740991';
        $('postgres-quarantine-new').addEventListener('click', openQuarantine);
        $('postgres-quarantine-refresh').addEventListener('click', refreshQuarantines);
        $('postgres-quarantine-cancel').addEventListener('click', closeQuarantine);
        $('quarantine-form-main').addEventListener('submit', submitQuarantine);
        for (const id of ['postgres-quarantine-status', 'postgres-quarantine-actions', 'postgres-quarantine-cancel']) $(id).classList.remove('postgres-hidden');
        for (const id of ['stock-history-from', 'stock-history-to', 'stock-history-type', 'stock-history-search']) {
            $(id).removeAttribute('onchange');
            $(id).removeAttribute('oninput');
        }
        $('stock-history-reset').classList.remove('postgres-hidden');
        $('stock-history-reset').addEventListener('click', () => {
            for (const id of ['stock-history-from', 'stock-history-to', 'stock-history-type', 'stock-history-search'])
                $(id).value = '';
            refreshStockHistory();
        });
        const historyOperation = $('stock-history-type').value;
        for (const value of ['Annulation drone', 'Modification expédition', 'Annulation expédition', 'Transfert entrant', 'Transfert sortant'])
            $('stock-history-type').add(new Option(value, value));
        $('stock-history-type').value = historyOperation;
        $('stock-history-explanation').textContent = 'La synthèse montre le stock actuel ; les filtres s’appliquent aux mouvements et inventaires après validation. Les courbes, impressions et exports utilisent uniquement les mouvements chargés.';
        $('stock-history-charts').classList.add('postgres-hidden');
        $('postgres-stock-history-actions').classList.remove('postgres-hidden');
        $('postgres-stock-history-apply').addEventListener('click', () => refreshStockHistory());
        $('postgres-stock-history-more').addEventListener('click', () => refreshStockHistory(true));
        $('postgres-stock-history-operations').addEventListener('click', () => openOperations(operationSections['stock-history']));
        $('stock-history-export').removeAttribute('onclick');
        $('stock-history-export').addEventListener('click', exportStockHistory);
        $('stock-history-print').removeAttribute('onclick');
        $('stock-history-print').addEventListener('click', openStockHistoryPrint);
        $('stock-history-print-confirm').removeAttribute('onclick');
        $('stock-history-print-confirm').addEventListener('click', () => {
            if (!stockHistoryPrintOpen) return;
            document.body.classList.add('stock-history-print-mode');
            window.print();
        });
        $('stock-history-print-close').removeAttribute('onclick');
        $('stock-history-print-close').addEventListener('click', closeStockHistoryPrint);
        for (const id of ['close-delivery-x', 'close-delivery-cancel']) {
            $(id).removeAttribute('onclick');
            $(id).addEventListener('click', closeDeliveryModal);
        }
        $('close-delivery-form').removeAttribute('onsubmit');
        $('close-delivery-form').addEventListener('submit', submitDeliveryClose);
        for (const id of ['postgres-close-delivery-detail', 'postgres-close-delivery-status']) $(id).classList.remove('postgres-hidden');
        for (const id of ['delivery-edit-close', 'delivery-edit-cancel']) $(id).addEventListener('click', closeDeliveryEdit);
        $('delivery-edit-add').addEventListener('click', () => { addDeliveryEditItem(); updateDeliveryEditNeeds(); });
        $('delivery-edit-form').addEventListener('submit', submitDeliveryEdit);
        $('postgres-print-close').removeAttribute('onclick');
        $('postgres-print-document').removeAttribute('onclick');
        $('postgres-print-close').addEventListener('click', closeDeliveryPrint);
        $('postgres-print-document').addEventListener('click', printDelivery);
        $('planning-print-close').addEventListener('click', closePlanningPrint);
        $('planning-print-button').addEventListener('click', printPlanningNeeds);
        window.addEventListener('afterprint', () => {
            document.body.classList.remove('postgres-bl-print');
            document.body.classList.remove('postgres-planning-print');
            document.body.classList.remove('stock-history-print-mode');
            document.body.classList.remove('report-print-mode');
            document.body.classList.remove('postgres-inventory-print');
            document.body.classList.remove('logistics-report-print-mode');
        });
        setText('history-bl-heading', 'N° BL');
        for (const view of ['drones', 'history', 'sorties']) {
            const actions = document.createElement('div');
            actions.className = 'px-5 flex gap-2';
            const refresh = document.createElement('button');
            refresh.type = 'button';
            refresh.className = 'px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold';
            refresh.textContent = 'Actualiser';
            refresh.addEventListener('click', () => refreshDeliveries(view));
            const manage = document.createElement('button');
            manage.type = 'button';
            manage.className = 'px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold';
            manage.textContent = 'Ouvrir les opérations et impressions';
            manage.classList.add('postgres-admin-flight-operations');
            manage.classList.add('postgres-hidden');
            manage.addEventListener('click', () => openOperations(operationSections[view]));
            actions.append(refresh, manage);
            $(`postgres-${view}-status`).before(actions);
            $(`postgres-${view}-status`).classList.remove('postgres-hidden');
        }
        login.removeAttribute('onsubmit');
        document.querySelector('[onclick="togglePasswordVisibility()"]').removeAttribute('onclick');
        document.querySelector('[title="Déconnexion"]').removeAttribute('onclick');
        portSelect.removeAttribute('onchange');
        const passwordToggle = document.getElementById('pwd-eye-icon').parentElement;
        passwordToggle.addEventListener('click', () => {
            const input = $('login-password');
            input.type = input.type === 'password' ? 'text' : 'password';
        });
        notice.hidden = false;
        notice.className = 'postgres-notice';
        addLine(notice, 'Mode PostgreSQL local : les totaux additionnent des conditionnements différents ; les données expirées restent dans le stock tant qu’elles ne sont pas mises en quarantaine. Actualisez après une opération.');
        const statusLine = document.createElement('p');
        statusLine.id = 'postgres-dashboard-status';
        statusLine.setAttribute('role', 'status');
        notice.append(statusLine);
        portSelect.addEventListener('change', () => {
            updateSiteNavigation();
            if (frameConnected) sendFrame({ type: 'qbox-set-port', port: portSelect.value });
            if (isStorage() && ['planning', 'archives', 'drones', 'history', 'sorties', 'csb'].includes(activeView)) {
                selectView('dashboard');
                return;
            }
            if (activeView === 'dashboard') refreshDashboard();
            else if (activeView === 'transfers') refreshTransfers();
            else if (activeView === 'products') refreshCatalog();
            else if (activeView === 'csb') refreshCsbs();
            else if (activeView === 'ports') refreshPorts();
            else if (['planning', 'archives'].includes(activeView)) refreshPlanCards(activeView);
            else if (['drones', 'history', 'sorties'].includes(activeView)) refreshDeliveries(activeView);
            else if (activeView === 'inventory') refreshInventories();
            else if (activeView === 'quarantine') refreshQuarantines();
            else if (activeView === 'stock-history') refreshStockHistory();
            else if (activeView === 'logistics-report') refreshLogisticsReport();
            else if (['stocks', 'salama'].includes(activeView)) refreshNativeView(activeView);
            else refreshReadView();
        });
        $('postgres-read-refresh').addEventListener('click', refreshReadView);
        $('postgres-read-manage').addEventListener('click', () => openOperations(operationSections[activeView]));
        $('legacy-dashboard-report').classList.remove('postgres-hidden');
        $('legacy-dashboard-report').removeAttribute('onclick');
        $('legacy-dashboard-report').addEventListener('click', openPostgresDashboardReport);
        $('legacy-stock-chart').classList.remove('postgres-hidden');
        $('postgres-dashboard-refresh').classList.remove('postgres-hidden');
        $('postgres-dashboard-refresh').addEventListener('click', refreshDashboard);
        $('legacy-planning-link').classList.remove('postgres-hidden');
        $('legacy-planning-link').removeAttribute('onclick');
        $('legacy-planning-link').addEventListener('click', () => selectView('planning'));
        $('report-plan-label').classList.add('postgres-hidden');
        $('dashboard-report-close').removeAttribute('onclick');
        $('dashboard-report-close').addEventListener('click', closePostgresDashboardReport);
        $('dashboard-report-print').removeAttribute('onclick');
        $('dashboard-report-print').addEventListener('click', printPostgresDashboardReport);
        $('inventory-print-close').addEventListener('click', closeInventoryPrint);
        $('inventory-print-button').addEventListener('click', () => {
            if (!inventoryPrintDraft || inventoryPrintDraft.port !== portSelect.value) return;
            document.body.classList.add('postgres-inventory-print');
            window.print();
        });
        document.querySelector('[title="Déconnexion"]').addEventListener('click', async () => {
            const requestGeneration = sessionGeneration;
            try { await api('/auth/v1/logout', {}, true); }
            catch (error) {
                if (sessionGeneration === requestGeneration) {
                    showLogin();
                    status.textContent = `Déconnexion locale : ${error.message}`;
                }
                return;
            }
            if (sessionGeneration !== requestGeneration) return;
            showLogin();
            status.textContent = 'Session fermée.';
        });
        $('password-open').classList.remove('postgres-hidden');
        $('password-open').addEventListener('click', () => {
            if (!passwordIdentity || passwordSaving) return;
            $('password-form').reset();
            $('password-status').textContent = '';
            $('password-dialog').showModal();
        });
        $('password-cancel').addEventListener('click', () => {
            if (passwordSaving) return;
            $('password-form').reset();
            $('password-dialog').close();
        });
        $('password-dialog').addEventListener('cancel', event => { if (passwordSaving) event.preventDefault(); });
        $('password-dialog').addEventListener('close', () => $('password-form').reset());
        $('password-form').addEventListener('submit', async event => {
            event.preventDefault();
            if (!passwordIdentity || passwordSaving) return;
            const current = $('password-current').value, next = $('password-new').value;
            if (next.length < 8 || next !== $('password-confirm').value || next === current) {
                $('password-status').textContent = 'Vérifiez la confirmation et choisissez un nouveau mot de passe différent de 8 caractères minimum.';
                return;
            }
            const identity = passwordIdentity, generation = passwordGeneration;
            passwordSaving = true;
            $('password-submit').disabled = true;
            $('password-cancel').disabled = true;
            try {
                const warning = await QBoxPassword.change(config, identity, current, next,
                    () => passwordGeneration === generation && passwordIdentity === identity);
                if (passwordGeneration !== generation) return;
                showLogin();
                status.textContent = warning || 'Mot de passe modifié. Reconnectez-vous avec le nouveau mot de passe.';
            } catch (error) {
                if (passwordGeneration === generation) $('password-status').textContent = error.message;
            } finally {
                if (passwordGeneration === generation) {
                    passwordSaving = false;
                    $('password-submit').disabled = false;
                    $('password-cancel').disabled = false;
                }
            }
        });
        login.addEventListener('submit', async event => {
            event.preventDefault();
            if (loginInProgress) return;
            loginInProgress = true;
            let loginGeneration = sessionGeneration;
            login.querySelector('button[type="submit"]').disabled = true;
            status.textContent = 'Connexion…';
            try {
                const session = await api('/auth/v1/token?grant_type=password', {
                    email: $('login-username').value.trim(), password: $('login-password').value
                });
                if (!session?.access_token) throw new Error('Réponse de connexion invalide.');
                if (sessionGeneration !== loginGeneration) return;
                loginGeneration = ++sessionGeneration;
                setSession(session);
                const profiles = await api('/rest/v1/rpc/qbox_my_profile', {}, true);
                if (sessionGeneration !== loginGeneration) return;
                const user = profiles[0];
                if (!user || user.status !== 'approved' || !roles[user.role]) throw new Error('Compte non approuvé : contactez un administrateur.');
                if (!user.user_id) throw new Error('Identité du compte indisponible.');
                passwordIdentity = {id:user.user_id, email:user.email};
                userRole = user.role;
                $('nav-admin-postgres').classList.toggle('postgres-hidden', userRole !== 'admin');
                for (const button of document.querySelectorAll('.postgres-admin-flight-operations'))
                    button.classList.toggle('postgres-hidden', userRole !== 'admin');
                const canManageFlights = hasRole(['admin', 'pilot']);
                const canReceiveStock = hasRole(['admin', 'logistics']);
                $('legacy-new-flight').classList.toggle('postgres-hidden', !canManageFlights);
                $('legacy-new-receipt').classList.toggle('postgres-hidden', !canReceiveStock);
                $('legacy-header-actions').classList.toggle('postgres-hidden', !canManageFlights && !canReceiveStock);
                const ports = await api('/rest/v1/rpc/qbox_list_warehouses', {}, true);
                if (sessionGeneration !== loginGeneration) return;
                warehouseRows = ports;
                portSelect.replaceChildren();
                for (const port of ports) portSelect.add(new Option(`${port.name} · ${port.region}`, port.id));
                updateSiteNavigation();
                setText('user-display-name', user.email);
                setText('user-display-role', roles[user.role]);
                setText('user-avatar', user.email.slice(0, 2).toUpperCase());
                $('login-password').value = '';
                $('auth-screen').classList.add('postgres-hidden');
                $('main-app').classList.remove('postgres-hidden');
                status.textContent = '';
                selectView('dashboard');
            } catch (error) {
                if (sessionGeneration === loginGeneration) {
                    showLogin();
                    status.textContent = error.message;
                }
            } finally {
                loginInProgress = false;
                login.querySelector('button[type="submit"]').disabled = false;
            }
        });
        showLogin();
        document.documentElement.classList.add('postgres-ready');
    }

    setup();
    fetch('local-config').then(async response => {
        if (!response.ok) throw new Error(`Configuration indisponible (${response.status}).`);
        const result = await response.json();
        const url = new URL(result.url);
        const localApi = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname) && url.port === '56521';
        const sameSecureOrigin = url.protocol === 'https:' && url.origin === location.origin;
        const hostedApi = url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && !url.port;
        if ((!localApi && !sameSecureOrigin && !hostedApi) || url.pathname !== '/' || url.search || url.hash ||
            url.username || url.password || !result.key) throw new Error('Configuration locale invalide.');
        config = { url: url.origin, key: result.key };
    }).catch(error => { status.textContent = `Configuration PostgreSQL indisponible : ${error.message}`; });
})();
