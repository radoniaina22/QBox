// FICHIER GÉNÉRÉ par `npm run build:assets` à partir de src/postgres-main/ : ne pas modifier ici.
'use strict';

(() => {
    const $ = id => document.getElementById(id);
    const roles = { admin: 'Admin', pilot: 'Pilote', pilot_rd: 'Pilote RD', logistics: 'Coordinateur logistique', unfpa: 'UNFPA', rh_chief: 'Chef Unité SR' };
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
    const nativeViewIds = ['stocks', 'salama', 'products', 'csb', 'ports', 'planning', 'archives', 'stock-analysis', 'drones', 'history', 'sorties', 'inventory', 'quarantine', 'stock-history', 'logistics-report', 'transfers', 'national', 'statistics', 'technical'];
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
        'stock-analysis': { title: 'Analyse des stocks et de la CMM des CSB' },
        transfers: { title: 'Transferts et expéditions terrestres' },
        national: { title: 'Vue nationale' },
        statistics: { title: 'Statistiques de livraison' },
        technical: { title: 'Statistiques techniques des vols' }
    };

    function setText(id, value) { $(id).textContent = value; }

    function isStorage() {
        return warehouseRows.find(port => port.id === portSelect.value)?.site_type === 'storage';
    }

    function updateSiteNavigation() {
        const storage = isStorage();
        for (const id of ['planning-navigation', 'nav-drones', 'nav-history', 'nav-statistics', 'nav-sorties', 'nav-csb',
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
        $('logistics-report-print-header').replaceChildren();
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
        clearNationalView();
        clearPerformanceIndicators();
        closeAlerts();
        $('nav-national').classList.add('postgres-hidden');
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
        clearPlanningDistrictSummary();
        clearStockAnalysis();
        $('archives-container').replaceChildren();
        $('drones-groups').replaceChildren();
        $('history-table-body').replaceChildren();
        $('history-closed-count').textContent = '';
        // Registre des clôtures : résumé, districts et planning en cours propres au compte précédent.
        $('history-closed-summary').replaceChildren();
        $('history-closed-district').replaceChildren(dsOption('', 'Tous les districts'));
        $('history-closed-district').value = '';
        historyClosedPlanning = null;
        $('history-closed-preset-planning').disabled = true;
        $('legacy-deliveries-count').textContent = '';
        // Statistiques techniques : données du compte précédent effacées (la carte est conservée, vide).
        clearTechnicalStats();
        $('technical-status').textContent = '';
        cypSequence++;
        clearCyp();
        $('cyp-status').textContent = '';
        if (statsPrintOpen) closeStatsPrint();
        if (populationRows) { populationSaving = false; closePopulations(); }
        $('sorties-table-body').replaceChildren();
        planningDraft = null;
        archiveDraft = null;
        planningCsbs = [];
        planningProducts = [];
        $('modal-planning').classList.add('hidden');
        $('modal-archive').classList.add('hidden');
        resetPlanningForm();
        flightDraft = null;
        $('modal-drone').classList.add('hidden');
        resetFlightParcels();
        $('drone-active-planning').replaceChildren();
        shipmentDraft = null;
        $('modal-sortie').classList.add('hidden');
        $('sortie-items').replaceChildren();
        $('postgres-sortie-needs').replaceChildren();
        inventoryDraft = null;
        $('inventory-form').classList.add('hidden');
        $('inventory-count-rows').replaceChildren();
        $('inventory-history').replaceChildren();
        resetStockHistoryView();
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
        resetReceiptRows();
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
        for (const id of ['dash-missions-list', 'dash-plannings-table', 'dash-expirations-list', 'dash-low-stock-list', 'dash-expiry-summary']) $(id).replaceChildren();
        $('dash-expiry-summary').hidden = true;
        $('dash-low-stock-count').hidden = true;
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
            // Méthodes CAP : facultatives (le formulaire reste utilisable si la liste est indisponible).
            const [categories, methods] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_categories', {}, true),
                api('/rest/v1/rpc/qbox_list_cyp_methods', {}, true).catch(() => null)
            ]);
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
            $('product-gtin').value = product?.gtin || '';
            $('product-gtin').dataset.original = product?.gtin || '';
            if (product) $('product-category').value = product.category_id;
            const cyp = $('product-cyp-method');
            // '' = non renseigné (signalé dans les CAP), 'none' = non contraceptif (exclu sans alerte).
            cyp.replaceChildren(new Option('Non renseignée', ''), new Option('Non contraceptif (exclu des CAP)', 'none'));
            for (const method of methods || []) {
                const factor = method.factor === null ? 'facteur non fourni'
                    : `${Number(method.factor).toLocaleString('fr-FR', { maximumSignificantDigits: 3 })} CAP / ${method.unit_label}`;
                const option = new Option(`${method.label} · ${factor}`, method.code);
                option.disabled = method.factor === null;
                cyp.add(option);
            }
            const cypValue = product?.cyp_not_applicable ? 'none' : product?.cyp_method || '';
            cyp.value = cypValue;
            cyp.dataset.original = cypValue;
            cyp.disabled = !methods;
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
        const gtin = $('product-gtin').value.replace(/\s/g, '');
        if (gtin && !/^\d{8}$|^\d{12,14}$/.test(gtin)) {
            $('postgres-product-form-status').textContent = 'Le code GTIN / EAN doit contenir 8, 12, 13 ou 14 chiffres.';
            return;
        }
        const gtinChanged = gtin.padStart(gtin ? 14 : 0, '0') !== ($('product-gtin').dataset.original || '');
        const cypControl = $('product-cyp-method');
        const cypMethod = cypControl.value || '';
        const cypChanged = !cypControl.disabled && cypMethod !== (cypControl.dataset.original || '');
        const requestGeneration = sessionGeneration;
        productSaving = true;
        markFormLocked('form-product');
        for (const control of $('form-product').querySelectorAll('input, select, button')) control.disabled = true;
        $('product-close').disabled = true;
        try {
            const savedId = await api('/rest/v1/rpc/qbox_save_product', {
                product_id: productEditing, product_name: name, product_category: category,
                product_unit: unit, product_threshold: threshold
            }, true);
            if (sessionGeneration !== requestGeneration) return;
            // Le GTIN s'enregistre à part ; un refus (doublon, clé invalide) n'annule pas l'intrant enregistré.
            let gtinError = '';
            if (gtinChanged) {
                try {
                    await api('/rest/v1/rpc/qbox_set_product_gtin', { product_id: savedId || productEditing, product_gtin: gtin || null }, true);
                } catch (error) { gtinError = error.message; }
                if (sessionGeneration !== requestGeneration) return;
            }
            // Méthode CAP : enregistrée à part elle aussi.
            let cypError = '';
            if (cypChanged) {
                try {
                    await api('/rest/v1/rpc/qbox_set_product_cyp', { product_id: savedId || productEditing, method_code: cypMethod || null }, true);
                } catch (error) { cypError = error.message; }
                if (sessionGeneration !== requestGeneration) return;
            }
            productSaving = false;
            closeProduct();
            if (frameConnected) sendFrame({ type: 'qbox-catalog-changed' });
            await refreshCatalog();
            if (sessionGeneration !== requestGeneration) return;
            $('postgres-products-status').textContent += gtinError ? ` Intrant enregistré, mais code GTIN refusé : ${gtinError}`
                : cypError ? ` Intrant enregistré, mais méthode CAP refusée : ${cypError}` : ' Intrant enregistré.';
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
            const suggestionMessage = applyTransferSuggestion(port);
            if (!suggestionMessage) addTransferItem();
            for (const transfer of transfers) $('transfer-list').append(renderTransferCard(transfer, port));
            if (!transfers.length) {
                const empty = document.createElement('p');
                empty.className = 'transfer-history-empty';
                empty.textContent = 'Aucune opération enregistrée pour ce magasin.';
                $('transfer-list').append(empty);
            }
            $('transfer-form').classList.toggle('postgres-hidden', !hasRole(['admin', 'logistics']));
            $('transfer-status').textContent = suggestionMessage || `${transfers.length} opération(s). Les transferts sont enregistrés comme reçus immédiatement.`;
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
        section.className = 'pc-history';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pc-link pc-link-history';
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

    // --- Cartes de campagne (Besoins prévisionnels et archives) ---
    // Statut d'un CSB : livré (tout reçu), expédié (plus rien à prévoir mais des colis en route), en cours, non commencé.
    const PLANNING_CSB_STATUS = {
        todo:     'Non commencé',
        progress: 'En cours',
        shipped:  'Expédié',
        done:     'Livré'
    };
    const PLANNING_CSB_ORDER = {todo: 0, progress: 0, shipped: 1, done: 2};
    // CSB dépliés, conservés entre deux actualisations de la liste.
    const planningOpenCsbs = new Set();

    function planningCsbStatus(group) {
        const effective = group.delivered + group.in_flight + group.in_transit;
        if (group.planned > 0n && group.delivered >= group.planned) return 'done';
        if (effective > 0n && group.remaining <= 0n) return 'shipped';
        if (effective > 0n) return 'progress';
        return group.planned > 0n ? 'todo' : 'done';
    }

    // Compare l'avancement de la campagne au temps écoulé (dates de Madagascar, bornes incluses).
    function planningPace(plan, percent, today = planningTodayIso()) {
        const day = iso => Date.parse(`${iso}T00:00:00Z`) / 86400000;
        const start = day(plan.start_date), end = day(plan.end_date), now = day(today);
        if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(now) || end < start) return null;
        const total = end - start + 1;
        if (now < start) return {timePercent: 0, status: 'upcoming', label: 'À venir', text: `Début le ${plan.start_date} · ${total} jour(s) de campagne`};
        const elapsed = Math.min(total, now - start + 1);
        const timePercent = Math.round(elapsed * 100 / total);
        const progress = percent === null ? null : Number(percent);
        let status, label;
        if (progress === null) [status, label] = ['neutral', 'Sans besoin chiffré'];
        else if (progress >= 100) [status, label] = ['done', 'Besoin couvert'];
        else if (now > end) [status, label] = ['late', 'Échéance dépassée'];
        else if (progress - timePercent >= 5) [status, label] = ['ahead', 'En avance'];
        else if (progress - timePercent >= -5) [status, label] = ['ontrack', 'Dans les temps'];
        else [status, label] = ['late', 'En retard'];
        const text = now > end ? `Campagne terminée le ${plan.end_date}`
            : `Jour ${elapsed} sur ${total} · ${timePercent} % du temps écoulé${progress === null ? '' : ` · ${progress} % couvert`}`;
        return {timePercent, status, label, text};
    }

    function planningItemsTable(group, view, plan) {
        const table = planningCell('table', '', 'pc-table');
        const head = document.createElement('thead');
        const headers = document.createElement('tr');
        for (const [text, right] of [['Intrant médical', false], ['Prévu', true], ['Livré', true], ['En vol', true], ['Transit terrestre', true], ['Restant à prévoir', true], ['Progression', false]])
            headers.append(planningCell('th', text, right ? 'pc-th pc-right' : 'pc-th'));
        head.append(headers);
        const body = document.createElement('tbody');
        for (const item of group.items) {
            const row = document.createElement('tr');
            const name = planningCell('th', item.product_name, 'pc-name');
            name.scope = 'row';
            row.append(name);
            for (const key of ['planned', 'delivered', 'in_flight', 'in_transit']) {
                const value = BigInt(item[key]);
                row.append(planningCell('td', number(item[key]), value ? 'pc-num' : 'pc-num pc-zero'));
            }
            const due = BigInt(item.remaining ?? 0) > 0n;
            const rest = planningCell('td', '', due ? 'pc-num pc-rest-due' : 'pc-num pc-rest-ok');
            if (!due) rest.append(planningIcon('ph-check-circle'));
            rest.append(planningCell('span', number(item.remaining ?? 0)));
            row.append(rest);
            const progressCell = planningCell('td', '', 'pc-progress-cell');
            const itemProgress = planningProgress(item.planned, item.delivered, item.in_flight, item.in_transit, `Avancement de ${item.product_name} pour ${group.name}`);
            progressCell.append(itemProgress.track, planningCell('span', itemProgress.percent === null ? 'N/A' : `${number(itemProgress.percent)}%`, 'pc-rate'));
            row.append(progressCell);
            body.append(row);
        }
        table.append(head, body);
        const scroll = planningCell('div', '', 'pc-scroll');
        scroll.append(table);
        return scroll;
    }

    function renderPlanCard(plan, view, port, districtOf = null) {
        const card = planningCell('article', '', 'pc-card');
        const grouped = new Map();
        const totals = {planned: 0n, delivered: 0n, in_flight: 0n, in_transit: 0n, remaining: 0n};
        for (const item of plan.items) {
            if (!grouped.has(item.csb_id)) grouped.set(item.csb_id, {id: item.csb_id, name: item.csb_name, items: [],
                planned: 0n, delivered: 0n, in_flight: 0n, in_transit: 0n, remaining: 0n});
            const group = grouped.get(item.csb_id);
            group.items.push(item);
            for (const key of ['planned', 'delivered', 'in_flight', 'in_transit']) {
                const value = BigInt(item[key]);
                group[key] += value;
                totals[key] += value;
            }
            const rest = BigInt(item.remaining ?? 0);
            if (rest > 0n) { group.remaining += rest; totals.remaining += rest; }
        }
        const progress = planningProgress(totals.planned, totals.delivered, totals.in_flight, totals.in_transit, `Avancement de ${plan.code}`);
        const percentText = progress.percent === null ? 'N/A' : `${number(progress.percent)}%`;
        const pace = view === 'planning' ? planningPace(plan, progress.percent) : null;

        // En-tête : période, code, CSB, orientation et modification.
        const header = planningCell('div', '', 'pc-head');
        const heading = planningCell('div', '', 'pc-heading');
        const meta = planningCell('div', '', 'pc-meta');
        meta.append(planningCell('span', plan.code, 'pc-chip'), planningCell('span', `${grouped.size} CSB concerné(s)`, 'pc-meta-item'));
        if (plan.folder) meta.append(planningCell('span', plan.folder, 'pc-meta-item'));
        heading.append(planningCell('h3', `Campagne du ${plan.start_date} au ${plan.end_date}`, 'pc-title'), meta);
        const actions = planningCell('div', '', 'pc-actions');
        if (pace) {
            const badge = planningCell('span', pace.label, `pc-pace pc-pace-${pace.status}`);
            badge.title = pace.text;
            actions.append(badge);
        }
        // Circuit de validation (10-planning-validation.js) : badge, mention, Soumettre / Valider.
        const review = appendPlanningValidation(plan, view, meta, actions);
        // Pendant la validation, seul le Chef Unité SR peut changer les quantités.
        if (view === 'planning' && hasRole(['admin', 'logistics']) && planningValidationState(plan) !== 'submitted') {
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'pc-button pc-button-edit';
            edit.textContent = 'Modifier la campagne';
            edit.addEventListener('click', () => openPlanning(plan.id));
            actions.append(edit);
        }
        header.append(heading, actions);

        // Indicateurs : avancement global puis quantités, tous intrants confondus.
        const kpis = planningCell('div', '', 'pc-kpis');
        const main = planningCell('div', '', 'pc-kpi pc-kpi-main');
        main.append(planningCell('span', 'Avancement', 'pc-kpi-label'), planningCell('strong', percentText, 'pc-kpi-value'),
            planningCell('span', `${number(progress.effective)} / ${number(totals.planned)} un. (${percentText})`, 'pc-kpi-hint'));
        kpis.append(main);
        for (const [label, value, hint, tone] of [
            ['Prévu', totals.planned, `${plan.items.length} ligne(s) de besoin`, 'planned'],
            ['Livré', totals.delivered, 'Reçu par les CSB', 'delivered'],
            ['En route', totals.in_flight + totals.in_transit, `En vol ${number(totals.in_flight)} · terrestre ${number(totals.in_transit)}`, 'flight'],
            ['Restant à prévoir', totals.remaining, totals.remaining > 0n ? 'À planifier en vol ou expédition' : 'Tout est couvert', totals.remaining > 0n ? 'due' : 'ok']
        ]) {
            const kpi = planningCell('div', '', `pc-kpi pc-kpi-${tone}`);
            kpi.append(planningCell('span', label, 'pc-kpi-label'), planningCell('strong', number(value), 'pc-kpi-value'), planningCell('span', hint, 'pc-kpi-hint'));
            kpis.append(kpi);
        }

        // Barre d'avancement, légende et temps écoulé.
        const progressArea = planningCell('div', '', 'pc-progress');
        const legend = planningCell('div', '', 'pc-legend');
        for (const [tone, text] of [['delivered', `Livré : ${number(totals.delivered)}`], ['flight', `En vol : ${number(totals.in_flight)}`],
            ['transit', `Transit terrestre : ${number(totals.in_transit)}`]]) {
            const chip = planningCell('span', '', `pc-legend-item pc-dot-${tone}`);
            chip.append(planningCell('span', text));
            legend.append(chip);
        }
        legend.append(planningCell('span', 'Totaux tous intrants confondus', 'pc-legend-note'));
        progressArea.append(progress.track, legend);
        if (pace) {
            const time = planningCell('div', '', 'pc-time');
            const label = planningCell('span', '', 'pc-time-label');
            label.append(planningIcon('ph-clock-countdown'), planningCell('span', pace.text));
            const track = planningCell('div', '', 'pc-time-track');
            track.setAttribute('aria-hidden', 'true');
            const fill = planningCell('div', '', 'pc-time-fill');
            fill.style.width = `${pace.timePercent}%`;
            track.append(fill);
            time.append(label, track);
            progressArea.append(time);
        }
        card.append(header);
        if (review) card.append(review);
        card.append(kpis, progressArea);

        // Liste des CSB : une ligne compacte par CSB, détail des intrants au clic.
        // Classées par district (ordre alphabétique, district non renseigné en dernier), puis par statut et restant.
        const groups = [...grouped.values()].map(group => ({...group, status: planningCsbStatus(group),
            district: districtOf ? districtOf.get(group.id) || NO_DISTRICT : null}));
        const byDistrict = (a, b) => a.district === b.district ? 0 : a.district === NO_DISTRICT ? 1 : b.district === NO_DISTRICT ? -1
            : String(a.district).localeCompare(String(b.district), 'fr');
        groups.sort((a, b) => byDistrict(a, b) || PLANNING_CSB_ORDER[a.status] - PLANNING_CSB_ORDER[b.status]
            || (b.remaining > a.remaining ? 1 : b.remaining < a.remaining ? -1 : 0)
            || String(a.name).localeCompare(String(b.name), 'fr'));
        const list = planningCell('div', '', 'pc-csbs');
        const listHead = planningCell('div', '', 'pc-csbs-head');
        const listTitle = planningCell('div', '', 'pc-csbs-title');
        const count = status => groups.filter(group => group.status === status).length;
        const pending = count('todo') + count('progress');
        listTitle.append(planningCell('h4', 'Besoins par CSB', 'pc-section-title'),
            planningCell('span', `${pending} à compléter · ${count('shipped')} expédié(s) · ${count('done')} livré(s)`, 'pc-csbs-count'));
        listHead.append(listTitle);
        const entries = [];
        const setOpen = (entry, open) => {
            entry.panel.hidden = !open;
            entry.toggle.setAttribute('aria-expanded', String(open));
            if (open) planningOpenCsbs.add(entry.key); else planningOpenCsbs.delete(entry.key);
        };
        if (groups.length > 1) {
            const all = document.createElement('button');
            all.type = 'button';
            all.className = 'pc-link';
            const label = () => { all.textContent = entries.every(entry => !entry.panel.hidden) ? 'Tout replier' : 'Tout déplier'; };
            all.addEventListener('click', () => {
                const open = entries.some(entry => entry.panel.hidden);
                for (const entry of entries) setOpen(entry, open);
                label();
            });
            listHead.append(all);
            entries.refreshLabel = label;
        }
        list.append(listHead);
        const districts = new Map();
        if (districtOf) for (const group of groups) {
            if (!districts.has(group.district)) districts.set(group.district, {count: 0, planned: 0n, effective: 0n, remaining: 0n});
            const total = districts.get(group.district);
            total.count += 1;
            total.planned += group.planned;
            total.effective += group.delivered + group.in_flight + group.in_transit;
            total.remaining += group.remaining;
        }
        let currentDistrict;
        for (const group of groups) {
            if (districtOf && group.district !== currentDistrict) {
                currentDistrict = group.district;
                const total = districts.get(currentDistrict);
                const percent = roundedProgress(total.effective, total.planned);
                const head = planningCell('div', '', group.district === NO_DISTRICT ? 'pc-district pc-district-none' : 'pc-district');
                const name = planningCell('h5', '', 'pc-district-name');
                name.append(planningIcon('ph-map-pin-area'), planningCell('span', currentDistrict));
                head.append(name, planningCell('span', `${total.count} CSB`, 'pc-district-count'),
                    planningCell('span', total.remaining > 0n ? `Reste ${number(total.remaining)}` : 'Couvert', total.remaining > 0n ? 'pc-district-rest pc-rest-due' : 'pc-district-rest pc-rest-ok'),
                    planningCell('span', percent === null ? '—' : `${number(percent)} %`, 'pc-district-rate'));
                list.append(head);
            }
            const key = `${view}:${plan.id}:${group.id}`;
            const row = planningCell('div', '', `pc-csb pc-csb-${group.status}`);
            const line = planningCell('div', '', 'pc-csb-line');
            const panel = planningCell('div', '', 'pc-csb-panel');
            panel.id = `planning-csb-${view}-${plan.id}-${group.id}`;
            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'pc-csb-toggle';
            toggle.setAttribute('aria-controls', panel.id);
            const mini = planningProgress(group.planned, group.delivered, group.in_flight, group.in_transit, `Avancement de ${group.name}`);
            mini.track.className = 'pc-mini flex';
            mini.track.setAttribute('aria-hidden', 'true');
            const bar = planningCell('span', '', 'pc-csb-bar');
            bar.append(mini.track, planningCell('span', mini.percent === null ? '—' : `${number(mini.percent)} %`, 'pc-csb-rate'));
            toggle.append(planningCell('span', group.name, 'pc-csb-name'), planningCell('span', PLANNING_CSB_STATUS[group.status], `pc-status pc-status-${group.status}`),
                bar, planningCell('span', group.remaining > 0n ? `Reste ${number(group.remaining)}` : 'Couvert', group.remaining > 0n ? 'pc-csb-rest pc-rest-due' : 'pc-csb-rest pc-rest-ok'));
            const print = document.createElement('button');
            print.type = 'button';
            print.className = 'pc-button pc-button-small pc-button-preview';
            print.textContent = 'Aperçu des besoins';
            print.addEventListener('click', () => openPlanningPrint(view, plan.id, group.id));
            line.append(toggle, print);
            panel.append(planningItemsTable(group, view, plan));
            const entry = {key, panel, toggle};
            entries.push(entry);
            setOpen(entry, planningOpenCsbs.has(key));
            toggle.addEventListener('click', () => {
                setOpen(entry, panel.hidden);
                entries.refreshLabel?.();
            });
            row.append(line, panel);
            list.append(row);
        }
        entries.refreshLabel?.();
        if (groups.length) card.append(list);
        else card.append(planningCell('p', 'Aucun besoin saisi pour cette campagne.', 'pc-empty'));
        appendPlanningHistory(card, view, plan.id, port);
        return card;
    }

    async function refreshPlanCards(view) {
            const port = portSelect.value;
            const seq = ++requestSequence;
            const requestGeneration = sessionGeneration;
            const container = $(view === 'planning' ? 'planning-cards-container' : 'archives-container');
            const notice = $(`postgres-${view}-status`);
            container.replaceChildren();
            if (view === 'planning') clearPlanningDistrictSummary();
            notice.textContent = port ? 'Chargement…' : 'Aucun port disponible.';
            if (!port) return;
            try {
                // Les CSB donnent le district de chaque ligne ; sans eux, les cartes s'affichent sans regroupement.
                const [result, csbs] = await Promise.all([
                    api('/rest/v1/rpc/qbox_list_plannings', { selected_port: port }, true),
                    api('/rest/v1/rpc/qbox_list_csbs', { selected_port: port }, true).catch(() => null)
                ]);
                if (seq !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
                const districtOf = csbs ? new Map(csbs.map(csb => [csb.id, csb.district || NO_DISTRICT])) : null;
                const plans = result.filter(plan => plan.status === (view === 'planning' ? 'En cours' : 'Archivé'));
                if (!plans.length) {
                    const empty = document.createElement('div');
                    empty.className = 'p-8 text-center text-slate-400 text-xs italic';
                    empty.textContent = view === 'planning' ? 'Aucun planning prévisionnel actif pour ce drone port.' : 'Aucun planning archivé.';
                    container.append(empty);
                }
                for (const plan of plans) container.append(renderPlanCard(plan, view, port, districtOf));
                notice.textContent = `${plans.length} planning(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
                const active = view === 'planning' && plans.find(plan => plan.items.length);
                // Chargée en arrière-plan : les cartes du planning ne dépendent pas de la lecture des stocks.
                if (active) loadPlanningDistrictSummary(active, view, port, seq, requestGeneration, notice, csbs);
            } catch (error) {
                if (seq === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                    notice.textContent = `Lecture indisponible : ${error.message}`;
            }
    }

    // --- Répartition des intrants planifiés par district ---
    const NO_DISTRICT = 'District non renseigné';

    function planningDistricts(plan, csbs) {
        const districtOf = new Map(csbs.map(csb => [csb.id, csb.district || NO_DISTRICT]));
        const districts = new Map(), products = new Map();
        let total = 0n;
        for (const item of plan.items) {
            const name = districtOf.get(item.csb_id) || NO_DISTRICT;
            const key = item.product_id || item.product_name;
            const planned = BigInt(item.planned);
            if (!districts.has(name)) districts.set(name, {name, csbs: new Set(), total: 0n, products: new Map()});
            const district = districts.get(name);
            district.csbs.add(item.csb_id);
            district.total += planned;
            district.products.set(key, (district.products.get(key) || 0n) + planned);
            if (!products.has(key)) products.set(key, {key, name: item.product_name, total: 0n});
            products.get(key).total += planned;
            total += planned;
        }
        const byName = (a, b) => a.name === NO_DISTRICT ? 1 : b.name === NO_DISTRICT ? -1 : a.name.localeCompare(b.name, 'fr');
        return {total, districts: [...districts.values()].sort(byName),
            products: [...products.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))};
    }

    const planningShare = (value, total) => total ? `${(Number(value * 1000n / total) / 10).toLocaleString('fr-FR')} %` : '0 %';

    function planningCell(tag, text, className = '') {
        const cell = document.createElement(tag);
        if (className) cell.className = className;
        cell.textContent = text;
        if (tag === 'th' && !cell.scope) cell.scope = 'col';
        return cell;
    }

    // Tableau croisé intrant × district, utilisé à l'écran et à l'impression.
    function planningDistrictMatrix(data, screen) {
        // À l'écran : classes pd-* (modern-theme.css) et intensité de 1 à 4 selon la part de l'intrant dans chaque district.
        const cls = screen ? {
            table: 'pd-table', th: 'pd-th', num: 'pd-num', name: 'pd-name', total: 'pd-num pd-total', foot: 'pd-foot'
        } : {};
        const table = document.createElement('table');
        if (cls.table) table.className = cls.table;
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        header.append(planningCell('th', 'Intrant', cls.th));
        for (const district of data.districts) header.append(planningCell('th', district.name, cls.th ? `${cls.th} pd-right` : ''));
        header.append(planningCell('th', 'Total', cls.th ? `${cls.th} pd-right pd-total` : ''));
        head.append(header);
        const body = document.createElement('tbody');
        for (const product of data.products) {
            const row = document.createElement('tr');
            const name = planningCell('th', product.name, cls.name);
            name.scope = 'row';
            row.append(name);
            for (const district of data.districts) {
                const value = district.products.get(product.key);
                const cell = planningCell('td', value ? number(value) : '—', value || !screen ? cls.num : `${cls.num} pd-empty`);
                if (screen && value && product.total) {
                    cell.dataset.heat = String(Math.min(4, Math.max(1, Math.ceil(Number(value * 4000n / product.total) / 1000))));
                    cell.title = `${district.name} : ${planningShare(value, product.total)} de ${product.name}`;
                }
                row.append(cell);
            }
            row.append(planningCell('td', number(product.total), cls.total));
            body.append(row);
        }
        const foot = document.createElement('tfoot');
        const totals = document.createElement('tr');
        if (cls.foot) totals.className = cls.foot;
        const label = planningCell('th', 'Total planifié', cls.name);
        label.scope = 'row';
        totals.append(label);
        for (const district of data.districts) totals.append(planningCell('td', number(district.total), cls.total));
        totals.append(planningCell('td', number(data.total), cls.total));
        foot.append(totals);
        table.append(head, body, foot);
        return table;
    }

    function renderPlanningDistrictSummary(plan, data, view) {
        const section = $('planning-district-summary');
        const icon = name => {
            const element = document.createElement('i');
            element.className = `ph ${name}`;
            element.setAttribute('aria-hidden', 'true');
            return element;
        };
        // Bandeau : titre, campagne, orientation globale et impression.
        const header = planningCell('div', '', 'pd-hero');
        const badge = planningCell('span', '', 'pd-hero-icon');
        badge.append(icon('ph-map-trifold'));
        const heading = planningCell('div', '', 'pd-hero-text');
        const title = planningCell('h3', 'Répartition des intrants planifiés par district', 'pd-title');
        title.id = 'planning-district-title';
        const meta = planningCell('div', '', 'pd-hero-meta');
        meta.append(planningCell('span', `Campagne ${plan.code}`, 'pd-chip'),
            planningCell('span', `Du ${plan.start_date} au ${plan.end_date}`, 'pd-hero-period'));
        meta.append(planningCell('span', `${data.districts.length} district(s) · ${number(data.total)} unité(s)`, 'pd-hero-period'));
        if (data.stock) meta.append(planningStatusBadge(planningGlobalVerdict(data.stock).status, 'pd-hero-status'));
        heading.append(title, meta);
        const print = document.createElement('button');
        print.type = 'button';
        print.className = 'pd-print';
        print.textContent = 'Imprimer la répartition';
        print.addEventListener('click', () => openPlanningPrint(view, plan.id, null));
        // Section repliée par défaut : le planning par CSB reste visible en premier.
        const content = planningCell('div', '', 'pd-body');
        content.id = 'planning-district-body';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'pd-toggle';
        toggle.setAttribute('aria-controls', content.id);
        const applyOpen = open => {
            content.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            toggle.textContent = open ? 'Masquer le détail' : 'Voir le détail';
        };
        applyOpen(planningDistrictOpen());
        toggle.addEventListener('click', () => {
            const open = content.hidden;
            planningDistrictOpen(open);
            applyOpen(open);
        });
        const actions = planningCell('div', '', 'pd-actions');
        actions.append(toggle, print);
        header.append(badge, heading, actions);

        // Indicateurs clés.
        const csbCount = data.districts.reduce((sum, district) => sum + district.csbs.size, 0);
        const kpis = planningCell('div', '', 'pd-kpis');
        for (const [name, label, value, tone] of [
            ['ph-package', 'Unités planifiées', number(data.total), 'primary'],
            ['ph-map-pin-area', 'Districts', number(data.districts.length), 'teal'],
            ['ph-first-aid-kit', 'CSB concernés', number(csbCount), 'accent'],
            ['ph-pill', 'Intrants', number(data.products.length), 'violet']
        ]) {
            const kpi = planningCell('div', '', `pd-kpi pd-tone-${tone}`);
            const kpiIcon = planningCell('span', '', 'pd-kpi-icon');
            kpiIcon.append(icon(name));
            const kpiText = planningCell('div', '', 'pd-kpi-text');
            kpiText.append(planningCell('span', label, 'pd-kpi-label'), planningCell('strong', value, 'pd-kpi-value'));
            kpi.append(kpiIcon, kpiText);
            kpis.append(kpi);
        }

        // Une carte par district : volume, part du total et intrant principal.
        const cards = planningCell('div', '', 'pd-cards');
        data.districts.forEach((district, index) => {
            const card = planningCell('div', '', 'planning-district-card pd-card');
            card.dataset.tone = district.name === NO_DISTRICT ? 'none' : String(index % 6);
            const top = planningCell('div', '', 'pd-card-top');
            top.append(planningCell('span', district.name, 'pd-card-name'), planningCell('span', `${district.csbs.size} CSB`, 'pd-pill'));
            const value = planningCell('div', '', 'pd-card-value');
            value.append(planningCell('strong', `${number(district.total)} un.`), planningCell('span', planningShare(district.total, data.total), 'pd-card-share'));
            const track = planningCell('div', '', 'pd-track');
            const fill = planningCell('div', '', 'pd-fill');
            fill.style.width = data.total ? `${Number(district.total * 100n / data.total)}%` : '0%';
            track.append(fill);
            card.append(top, value, track);
            let main = null;
            for (const product of data.products) {
                const planned = district.products.get(product.key) || 0n;
                if (planned && (!main || planned > main.planned)) main = {name: product.name, planned};
            }
            if (main) {
                const lead = planningCell('div', '', 'pd-card-lead');
                lead.append(icon('ph-star'), planningCell('span', `Principal : ${main.name} (${number(main.planned)})`));
                card.append(lead);
            }
            cards.append(card);
        });

        // Tableau croisé intrant × district.
        const matrix = planningCell('div', '', 'pd-matrix');
        const matrixHead = planningCell('div', '', 'pd-matrix-head');
        const matrixTitle = planningCell('h4', '', 'pd-subtitle');
        matrixTitle.append(icon('ph-grid-four'), planningCell('span', 'Détail par intrant et par district'));
        const legend = planningCell('div', '', 'pd-legend');
        legend.append(planningCell('span', 'Part de l’intrant'));
        for (const level of ['1', '2', '3', '4']) {
            const swatch = planningCell('span', '', 'pd-swatch');
            swatch.dataset.heat = level;
            legend.append(swatch);
        }
        legend.append(planningCell('span', '100 %'));
        matrixHead.append(matrixTitle, legend);
        const scroll = planningCell('div', '', 'pd-scroll');
        scroll.append(planningDistrictMatrix(data, true));
        matrix.append(matrixHead, scroll);

        content.append(kpis, cards, matrix);
        if (data.stock) content.append(planningStockSection(data.stock, true));
        section.replaceChildren(header, content);
        section.hidden = false;
    }

    // État déplié/replié de la répartition par district, mémorisé dans le navigateur (préférence d'affichage seulement).
    const PLANNING_DISTRICT_OPEN_KEY = 'qbox.planningDistrictOpen';
    let planningDistrictOpenState = null;
    function planningDistrictOpen(value) {
        if (value !== undefined) {
            planningDistrictOpenState = value;
            try { if (typeof localStorage !== 'undefined') localStorage.setItem(PLANNING_DISTRICT_OPEN_KEY, value ? '1' : '0'); } catch { /* stockage indisponible */ }
            return value;
        }
        if (planningDistrictOpenState === null) {
            try { planningDistrictOpenState = typeof localStorage !== 'undefined' && localStorage.getItem(PLANNING_DISTRICT_OPEN_KEY) === '1'; }
            catch { planningDistrictOpenState = false; }
        }
        return planningDistrictOpenState;
    }

    // --- Comparaison planifié / stock disponible du port ---
    // Le besoin à couvrir est le restant à livrer (planifié - livré - en vol - transit terrestre).
    // Le stock utilisable exclut les lots périmés ; les lots qui expirent avant la fin de campagne sont signalés.
    const PLANNING_STOCK_STATUS = {
        covered:  {label: 'Besoin couvert',   icon: 'ph-check-square',  tone: 'bg-sky-50 text-sky-700 border-sky-200',             advice: 'Tout est livré ou en cours de livraison.'},
        ok:       {label: 'Stock suffisant',  icon: 'ph-check-circle',  tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', advice: 'Le stock couvre le restant à livrer.'},
        tight:    {label: 'Couverture juste', icon: 'ph-warning',       tone: 'bg-amber-50 text-amber-800 border-amber-200',       advice: 'Marge inférieure à 10 % : anticiper un réapprovisionnement.'},
        short:    {label: 'En manque',        icon: 'ph-warning-circle', tone: 'bg-orange-50 text-orange-800 border-orange-200',   advice: 'Stock insuffisant : commander ou transférer la quantité manquante.'},
        out:      {label: 'Rupture',          icon: 'ph-x-circle',      tone: 'bg-red-50 text-red-700 border-red-200',             advice: 'Aucun stock utilisable : réapprovisionnement urgent.'}
    };

    function planningTodayIso() {
        return new Date().toLocaleDateString('sv-SE', {timeZone: 'Indian/Antananarivo'});
    }

    function planningStockComparison(plan, stocks, today = planningTodayIso()) {
        const rows = new Map();
        const rowFor = (key, name) => {
            if (!rows.has(key)) rows.set(key, {key, name, unit: '', planned: 0n, remaining: 0n, usable: 0n, expiring: 0n, expired: 0n});
            return rows.get(key);
        };
        for (const item of plan.items) {
            const row = rowFor(item.product_id || item.product_name, item.product_name);
            row.planned += BigInt(item.planned);
            row.remaining += BigInt(item.remaining ?? 0);
        }
        for (const lot of stocks) {
            const row = rows.get(lot.product_id) || rows.get(lot.name);
            if (!row) continue;
            const available = BigInt(lot.available ?? 0);
            row.unit ||= lot.unit || '';
            if (available <= 0n) continue;
            if (lot.expiry_date && lot.expiry_date < today) { row.expired += available; continue; }
            row.usable += available;
            if (lot.expiry_date && plan.end_date && lot.expiry_date <= plan.end_date) row.expiring += available;
        }
        const totals = {planned: 0n, remaining: 0n, usable: 0n, missing: 0n};
        const list = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr')).map(row => {
            const gap = row.usable - row.remaining;
            const status = row.remaining <= 0n ? 'covered' : row.usable === 0n ? 'out' : gap < 0n ? 'short'
                : gap * 10n < row.remaining ? 'tight' : 'ok';
            totals.planned += row.planned;
            totals.remaining += row.remaining > 0n ? row.remaining : 0n;
            totals.usable += row.usable;
            if (gap < 0n && row.remaining > 0n) totals.missing -= gap;
            return {...row, gap, status};
        });
        const counts = Object.fromEntries(Object.keys(PLANNING_STOCK_STATUS).map(key => [key, list.filter(row => row.status === key).length]));
        return {rows: list, totals, counts, today, endDate: plan.end_date};
    }

    const planningCoverage = (usable, remaining) => remaining > 0n
        ? `${(Number(usable * 1000n / remaining) / 10).toLocaleString('fr-FR')} %` : '—';
    const signedNumber = value => value > 0n ? `+${number(value)}` : number(value);

    function planningStatusBadge(status, extraClass = '') {
        const info = PLANNING_STOCK_STATUS[status];
        const badge = document.createElement('span');
        badge.className = `planning-stock-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${info.tone} ${extraClass}`;
        badge.title = info.advice;
        const icon = document.createElement('i');
        icon.className = `ph ${info.icon}`;
        icon.setAttribute('aria-hidden', 'true');
        badge.append(icon, planningCell('span', info.label));
        return badge;
    }

    function planningInfoBadge(text, title) {
        const badge = planningCell('span', text, 'planning-stock-badge inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap bg-violet-50 text-violet-700 border-violet-200');
        badge.title = title;
        return badge;
    }

    function planningGlobalVerdict(stock) {
        const {counts, rows, totals} = stock;
        const problems = counts.out + counts.short;
        if (!rows.length) return {status: 'covered', text: 'Aucun intrant planifié.'};
        if (problems) return {status: counts.out ? 'out' : 'short',
            text: `${problems} intrant(s) sur ${rows.length} en manque ou en rupture · ${number(totals.missing)} unité(s) manquante(s) au total.`};
        if (counts.tight) return {status: 'tight', text: `Stock suffisant mais ${counts.tight} intrant(s) avec une marge inférieure à 10 %.`};
        if (counts.ok) return {status: 'ok', text: `Le stock disponible couvre le restant à livrer de tous les intrants.`};
        return {status: 'covered', text: 'Tous les besoins sont livrés ou en cours de livraison.'};
    }

    function planningStockSection(stock, screen) {
        const wrapper = document.createElement(screen ? 'div' : 'section');
        if (screen) wrapper.className = 'planning-stock-comparison px-5 pb-5 space-y-3';
        const heading = document.createElement('div');
        if (screen) heading.className = 'pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2';
        const titleBox = document.createElement('div');
        titleBox.append(planningCell(screen ? 'h4' : 'h2', 'Comparaison avec le stock disponible', screen ? 'text-xs font-bold text-slate-800' : ''),
            planningCell('p', `Restant à livrer (planifié − livré − en vol − transit terrestre) comparé au stock disponible du port, lots périmés exclus (au ${stock.today}).`,
                screen ? 'text-[11px] text-slate-500' : ''));
        const verdict = planningGlobalVerdict(stock);
        const verdictBox = document.createElement('div');
        if (screen) verdictBox.className = 'flex items-center gap-2';
        verdictBox.append(planningStatusBadge(verdict.status), planningCell('span', verdict.text, screen ? 'text-[11px] font-semibold text-slate-700' : ''));
        heading.append(titleBox, verdictBox);
        const cls = screen ? {
            table: 'w-full text-left border-collapse text-xs', th: 'py-2 px-2 text-[10px] uppercase font-semibold text-slate-500 whitespace-nowrap',
            name: 'py-2 px-2 font-semibold text-slate-800', num: 'py-2 px-2 text-right font-mono text-slate-700 whitespace-nowrap',
            bold: 'py-2 px-2 text-right font-mono font-bold whitespace-nowrap', cell: 'py-2 px-2'
        } : {};
        const table = document.createElement('table');
        if (cls.table) table.className = cls.table;
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        if (screen) header.className = 'border-b border-slate-200';
        [['Intrant', ''], ['Planifié', 'r'], ['Restant à livrer', 'r'], ['Stock disponible', 'r'], ['Écart', 'r'], ['Couverture', 'r'], ['Orientation', '']]
            .forEach(([text, align]) => header.append(planningCell('th', text, cls.th ? `${cls.th}${align ? ' text-right' : ''}` : '')));
        head.append(header);
        const body = document.createElement('tbody');
        if (screen) body.className = 'divide-y divide-slate-100';
        for (const row of stock.rows) {
            const tr = document.createElement('tr');
            if (screen) tr.className = 'hover:bg-slate-50';
            const name = planningCell('th', row.unit ? `${row.name} (${row.unit})` : row.name, cls.name);
            name.scope = 'row';
            const gapTone = screen ? (row.gap < 0n && row.remaining > 0n ? ' text-red-600' : ' text-emerald-700') : '';
            const badges = document.createElement('td');
            if (cls.cell) badges.className = `${cls.cell} space-x-1 whitespace-nowrap`;
            badges.append(planningStatusBadge(row.status));
            if (row.gap < 0n && row.remaining > 0n) badges.append(planningInfoBadge(`Manque ${number(-row.gap)}`, 'Quantité à commander ou transférer pour couvrir le restant à livrer.'));
            if (row.expiring > 0n) badges.append(planningInfoBadge(`${number(row.expiring)} expirent avant la fin`, `Lots disponibles qui expirent d’ici le ${stock.endDate} : à livrer en priorité.`));
            if (row.expired > 0n) badges.append(planningInfoBadge(`${number(row.expired)} périmé(s)`, 'Lots périmés exclus du stock utilisable : à mettre en quarantaine.'));
            tr.append(name, planningCell('td', number(row.planned), cls.num), planningCell('td', number(row.remaining > 0n ? row.remaining : 0n), cls.num),
                planningCell('td', number(row.usable), cls.num), planningCell('td', row.remaining > 0n ? signedNumber(row.gap) : '—', cls.bold ? cls.bold + gapTone : ''),
                planningCell('td', planningCoverage(row.usable, row.remaining), cls.num), badges);
            body.append(tr);
        }
        const foot = document.createElement('tfoot');
        const total = document.createElement('tr');
        if (screen) total.className = 'border-t-2 border-slate-200 bg-slate-50';
        const label = planningCell('th', 'Grand total', cls.name);
        label.scope = 'row';
        const totalGap = stock.totals.usable - stock.totals.remaining;
        const status = document.createElement('td');
        if (cls.cell) status.className = cls.cell;
        status.append(planningStatusBadge(verdict.status));
        total.append(label, planningCell('td', number(stock.totals.planned), cls.bold), planningCell('td', number(stock.totals.remaining), cls.bold),
            planningCell('td', number(stock.totals.usable), cls.bold), planningCell('td', stock.totals.remaining > 0n ? signedNumber(totalGap) : '—', cls.bold),
            planningCell('td', planningCoverage(stock.totals.usable, stock.totals.remaining), cls.bold), status);
        foot.append(total);
        table.append(head, body, foot);
        const scroll = document.createElement('div');
        if (screen) scroll.className = 'overflow-x-auto';
        scroll.append(table);
        const note = planningCell('p', 'Le grand total additionne des intrants d’unités différentes : il donne un ordre de grandeur, l’orientation se lit intrant par intrant.',
            screen ? 'text-[10px] text-slate-400 italic' : '');
        wrapper.append(heading, scroll, note);
        return wrapper;
    }

    async function loadPlanningDistrictSummary(plan, view, port, seq, requestGeneration, notice, knownCsbs = null) {
        const current = () => seq === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration;
        try {
            const [csbs, stocks] = await Promise.all([
                knownCsbs || api('/rest/v1/rpc/qbox_list_csbs', {selected_port: port}, true),
                api('/rest/v1/rpc/qbox_list_stocks', {selected_port: port}, true)
            ]);
            if (!current()) return;
            const districts = planningDistricts(plan, csbs);
            districts.stock = planningStockComparison(plan, stocks);
            renderPlanningDistrictSummary(plan, districts, view);
        } catch (error) {
            if (current()) notice.textContent += ` Répartition par district indisponible : ${error.message}`;
        }
    }

    function clearPlanningDistrictSummary() {
        $('planning-district-summary').replaceChildren();
        $('planning-district-summary').hidden = true;
    }

    async function readPlanningPrint(port, planId, csbId) {
        const [plans, ports, csbs, stocks] = await Promise.all([
            api('/rest/v1/rpc/qbox_list_plannings', {selected_port:port}, true),
            api('/rest/v1/rpc/qbox_list_ports', {}, true),
            csbId ? null : api('/rest/v1/rpc/qbox_list_csbs', {selected_port:port}, true),
            csbId ? null : api('/rest/v1/rpc/qbox_list_stocks', {selected_port:port}, true)
        ]);
        const plan = plans.find(item => item.id === planId);
        const selectedPort = ports.find(item => item.id === port);
        const items = plan ? plan.items.filter(item => !csbId || item.csb_id === csbId) : [];
        if (!plan || !selectedPort || !items.length) throw new Error('Besoins ou port introuvables : actualisez la liste.');
        if (csbId) return {plan, port:selectedPort, items};
        const districts = planningDistricts(plan, csbs);
        districts.stock = planningStockComparison(plan, stocks);
        return {plan, port:selectedPort, districts};
    }

    // En-tête commun des impressions de planning : logo UNFPA, identité Q.box, type de document, port et date d'édition.
    // plan peut être null (documents hors campagne, ex. état des stocks) : detail remplace alors la ligne de campagne.
    function planningPrintHeader(kind, plan, port, detail = '') {
        const header = planningCell('div', '', 'stock-report-header planning-print-header');
        const identity = planningCell('div', '', 'stock-report-identity');
        const logo = document.createElement('img');
        logo.src = 'logo-unfpa.svg';
        logo.alt = 'Logo UNFPA';
        logo.className = 'stock-report-logo planning-print-logo';
        const organization = planningCell('div', '', 'stock-report-organization');
        organization.append(planningCell('strong', 'UNFPA Madagascar'), planningCell('span', 'Q.box · Logistique santé par drone'));
        identity.append(logo, organization);
        const meta = planningCell('div', '', 'stock-report-header-meta');
        meta.append(planningCell('strong', kind), planningCell('span', `${port.name}${port.region ? ` · ${port.region}` : ''}`),
            planningCell('span', plan ? `Campagne ${plan.code} · ${plan.start_date} au ${plan.end_date}` : detail),
            planningCell('span', `Édité le ${localDateTime(new Date())} (Madagascar)`));
        // État de validation du planning (Chef Unité SR) sur tout document de campagne.
        if (plan) {
            const state = planningValidationState(plan);
            meta.append(planningCell('span', state === 'validated'
                ? (plan.validated_at ? `Validé par ${plan.validated_by_name || 'le Chef Unité SR'} le ${localDateTime(plan.validated_at)}` : 'Planning validé')
                : state === 'submitted' ? 'Planning en attente de validation par le Chef Unité SR' : 'Planning non validé (en préparation)'));
        }
        header.append(identity, meta);
        return header;
    }

    function renderPlanningDistrictPrint({plan, port, districts: data}) {
        const report = $('planning-print-content');
        report.replaceChildren(planningPrintHeader('RÉPARTITION DES BESOINS PAR DISTRICT', plan, port));
        for (const [tag, value] of [
            ['h1', `Répartition des intrants planifiés par district · ${plan.code}`],
            ['p', `Port : ${port.name} · ${port.region}`],
            ['p', `Période : ${plan.start_date} au ${plan.end_date} · Statut : ${plan.status}`],
            ['h2', 'Synthèse par district']
        ]) report.append(planningCell(tag, value));
        const summary = document.createElement('table');
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        for (const value of ['District', 'CSB', 'Total planifié', 'Part du total']) header.append(planningCell('th', value));
        head.append(header);
        const body = document.createElement('tbody');
        for (const district of data.districts) {
            const row = document.createElement('tr');
            row.append(planningCell('td', district.name), planningCell('td', String(district.csbs.size)),
                planningCell('td', number(district.total)), planningCell('td', planningShare(district.total, data.total)));
            body.append(row);
        }
        const foot = document.createElement('tfoot');
        const total = document.createElement('tr');
        total.append(planningCell('th', 'Total'), planningCell('td', String(data.districts.reduce((sum, d) => sum + d.csbs.size, 0))),
            planningCell('td', number(data.total)), planningCell('td', '100 %'));
        foot.append(total);
        summary.append(head, body, foot);
        report.append(summary, planningCell('h2', 'Détail par intrant et par district'), planningDistrictMatrix(data, false));
        if (data.stock) report.append(planningStockSection(data.stock, false));
    }

    // --- Impression « Stocks et lots » (même fenêtre d'aperçu que les impressions de planning) ---
    const STOCK_PRINT_SOON_DAYS = 90;

    function stockMatches(row, query) {
        return !query || [row.name, row.lot, row.category, row.code]
            .some(value => String(value || '').toLocaleLowerCase('fr-FR').includes(query));
    }

    // Relit les stocks au moment de l'aperçu et de l'impression ; le filtre de recherche de la page est appliqué.
    async function readStockPrint(port, query) {
        const [stocks, products, ports] = await Promise.all([
            api('/rest/v1/rpc/qbox_list_stocks', {selected_port: port}, true),
            api('/rest/v1/rpc/qbox_list_products', {}, true),
            api('/rest/v1/rpc/qbox_list_ports', {}, true)
        ]);
        const selectedPort = ports.find(item => item.id === port);
        if (!selectedPort) throw new Error('Magasin introuvable : actualisez la page.');
        const catalog = new Map(products.map(product => [product.id, product]));
        const rows = stocks.map(row => ({...row, code: catalog.get(row.product_id)?.code, threshold: catalog.get(row.product_id)?.min_threshold}))
            .filter(row => stockMatches(row, query));
        return {stocks: rows, port: selectedPort, query, total: stocks.length};
    }

    function stockExpiryStatus(expiry, today) {
        if (!expiry) return ['Non datée', 'none'];
        if (expiry < today) return ['Périmé', 'expired'];
        const soon = new Date(`${today}T00:00:00Z`);
        soon.setUTCDate(soon.getUTCDate() + STOCK_PRINT_SOON_DAYS);
        return expiry <= soon.toISOString().slice(0, 10) ? [`Moins de ${STOCK_PRINT_SOON_DAYS} jours`, 'soon'] : ['Valide', 'ok'];
    }

    function renderStockPrint({stocks, port, query, total}) {
        const report = $('planning-print-content');
        const today = planningTodayIso();
        report.replaceChildren(planningPrintHeader('ÉTAT DES STOCKS ET DES LOTS', null, port, `Situation au ${today}`));
        report.append(planningCell('h1', 'État des stocks et traçabilité par lot'),
            planningCell('p', `Magasin : ${port.name}${port.region ? ` · ${port.region}` : ''} · ${stocks.length} lot(s)${query ? ` correspondant au filtre « ${query} » sur ${total}` : ''}.`),
            planningCell('p', 'Disponible = stock du lot − quantités réservées aux vols en cours. Lots classés par intrant puis par date de péremption (règle FEFO).'));
        // Synthèse par intrant
        const products = new Map();
        for (const row of stocks) {
            if (!products.has(row.product_id)) products.set(row.product_id, {name: row.name, code: row.code, unit: row.unit, threshold: row.threshold,
                lots: 0, quantity: 0n, reserved: 0n, available: 0n, next: null, expired: 0n});
            const product = products.get(row.product_id);
            product.lots++;
            product.quantity += BigInt(row.quantity);
            product.reserved += BigInt(row.reserved);
            product.available += BigInt(row.available);
            if (row.expiry_date && row.expiry_date < today) product.expired += BigInt(row.available);
            else if (row.expiry_date && BigInt(row.available) > 0n && (!product.next || row.expiry_date < product.next)) product.next = row.expiry_date;
        }
        const summary = document.createElement('table');
        const summaryHead = document.createElement('thead');
        const summaryHeader = document.createElement('tr');
        for (const value of ['Réf.', 'Intrant', 'Unité', 'Lots', 'Stock', 'Réservé', 'Disponible', 'Seuil', 'Niveau', 'Prochaine péremption'])
            summaryHeader.append(planningCell('th', value));
        summaryHead.append(summaryHeader);
        const summaryBody = document.createElement('tbody');
        for (const product of [...products.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))) {
            const threshold = product.threshold === null || product.threshold === undefined ? null : BigInt(product.threshold);
            const level = threshold === null || threshold <= 0n ? 'Seuil non défini'
                : product.available < threshold ? 'Sous le seuil' : product.available * 2n <= threshold * 3n ? 'À surveiller' : 'Suffisant';
            const row = document.createElement('tr');
            row.append(planningCell('td', product.code || '—'), planningCell('td', product.name), planningCell('td', product.unit || ''),
                planningCell('td', String(product.lots)), planningCell('td', number(product.quantity)), planningCell('td', number(product.reserved)),
                planningCell('td', number(product.available)), planningCell('td', threshold === null ? '—' : number(threshold)),
                planningCell('td', product.expired > 0n ? `${level} · ${number(product.expired)} périmé(s)` : level), planningCell('td', product.next || '—'));
            summaryBody.append(row);
        }
        summary.append(summaryHead, summaryBody);
        // Détail par lot
        const detail = document.createElement('table');
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        for (const value of ['Réf.', 'Désignation', 'Catégorie', 'N° lot', 'Péremption', 'Stock', 'Réservé', 'Disponible', 'Unité', 'État'])
            header.append(planningCell('th', value));
        head.append(header);
        const body = document.createElement('tbody');
        const sorted = [...stocks].sort((a, b) => a.name.localeCompare(b.name, 'fr') || String(a.expiry_date || '9999').localeCompare(String(b.expiry_date || '9999')) || String(a.lot).localeCompare(String(b.lot)));
        for (const row of sorted) {
            const [state, tone] = stockExpiryStatus(row.expiry_date, today);
            const tr = document.createElement('tr');
            if (tone === 'expired' || tone === 'soon') tr.className = `stock-print-${tone}`;
            tr.append(planningCell('td', row.code || '—'), planningCell('td', row.name), planningCell('td', row.category || ''),
                planningCell('td', row.lot), planningCell('td', row.expiry_date || 'Non renseignée'), planningCell('td', number(row.quantity)),
                planningCell('td', number(row.reserved)), planningCell('td', number(row.available)), planningCell('td', row.unit || ''), planningCell('td', state));
            body.append(tr);
        }
        if (!sorted.length) {
            const empty = document.createElement('tr');
            const cell = planningCell('td', 'Aucun lot correspondant.');
            cell.colSpan = 10;
            empty.append(cell);
            body.append(empty);
        }
        detail.append(head, body);
        // Visas
        const signatures = planningCell('div', '', 'stock-print-signatures');
        for (const role of ['Établi par (magasinier)', 'Vérifié par', 'Visa du responsable'])
            signatures.append(planningCell('div', role, 'stock-print-signature'));
        report.append(planningCell('h2', 'Synthèse par intrant'), summary, planningCell('h2', 'Détail par lot'), detail, signatures);
    }

    async function openStockPrint() {
        if (planningPrintDraft || activeView !== 'stocks' || !portSelect.value) return;
        const port = portSelect.value, sequence = ++planningPrintSequence, request = requestSequence, requestGeneration = sessionGeneration;
        const query = $('stock-search').value.trim().toLocaleLowerCase('fr-FR');
        $('postgres-stocks-status').textContent = 'Préparation de l’impression…';
        try {
            const data = await readStockPrint(port, query);
            if (sequence !== planningPrintSequence || request !== requestSequence || activeView !== 'stocks' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            renderPlanningPrint(data);
            planningPrintDraft = {view: 'stocks', kind: 'stocks', port, query};
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('planning-print-modal').classList.remove('hidden');
            $('postgres-stocks-status').textContent = 'Aperçu chargé.';
        } catch (error) {
            if (sequence === planningPrintSequence && request === requestSequence && activeView === 'stocks' && port === portSelect.value && sessionGeneration === requestGeneration)
                $('postgres-stocks-status').textContent = `Impossible de préparer l’impression : ${error.message}`;
        }
    }

    function renderPlanningPrint(data) {
        $('planning-print-title').textContent = data.stocks ? 'Aperçu de l’état des stocks et des lots'
            : data.districts ? 'Aperçu de la répartition par district' : 'Aperçu des besoins par CSB';
        if (data.stocks) return renderStockPrint(data);
        if (data.districts) return renderPlanningDistrictPrint(data);
        const {plan, port, items} = data;
        const report = $('planning-print-content');
        report.replaceChildren(planningPrintHeader('EXPRESSION DES BESOINS PRÉVISIONNELS', plan, port));
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
            const data = draft.kind === 'stocks' ? await readStockPrint(draft.port, draft.query)
                : await readPlanningPrint(draft.port, draft.planId, draft.csbId);
            if (sequence !== planningPrintSequence || planningPrintDraft !== draft || sessionGeneration !== requestGeneration || draft.port !== portSelect.value) return;
            renderPlanningPrint(data);
            // Attendre le chargement du logo pour qu'il figure sur la page imprimée (impression maintenue en cas d'échec).
            try { await $('planning-print-content').querySelector('.planning-print-logo')?.decode?.(); } catch { /* logo indisponible */ }
            if (sequence !== planningPrintSequence || planningPrintDraft !== draft || sessionGeneration !== requestGeneration) return;
            document.body.classList.add('postgres-planning-print');
            window.print();
        } catch (error) {
            if (sequence === planningPrintSequence && sessionGeneration === requestGeneration) {
                closePlanningPrint();
                $(`postgres-${draft.view}-status`).textContent = `Impossible d’imprimer ${draft.kind === 'stocks' ? 'l’état des stocks' : 'les besoins'} : ${error.message}`;
            }
        } finally { if (sessionGeneration === requestGeneration) $('planning-print-button').disabled = false; }
    }

    // ---------- Couples-Année de Protection (CAP) livrés (écran Statistiques) — style : delivery-stats.css (ds-cyp-*) ----------
    // Données : qbox_cyp_estimate (quantités livrées × facteur standard de la méthode de l'intrant, document
    // « Facteurs de conversion standards »). Estimation des CAP *livrés* (aux CSB par défaut), pas des clientes servies.
    // Période et origine : celles du bandeau des statistiques (statsPeriod, deliveryStatsSource) ; refreshCyp est
    // appelé par refreshDeliveryStats.
    const CYP_TABS = [
        { key: 'products', label: 'Par intrant' },
        { key: 'districts', label: 'Par district' },
        { key: 'destinations', label: 'Par CSB' }
    ];
    // Familles de méthodes (répartition des CAP) : ordre et couleur fixes (classe ds-cyp-f-<clé>, delivery-stats.css),
    // une famille garde sa couleur quel que soit son rang. Longue durée = implants et DIU.
    const CYP_FAMILIES = [
        { key: 'implant', label: 'Implants', long: true, match: code => code.startsWith('implant') },
        { key: 'iud', label: 'DIU', long: true, match: code => code.startsWith('iud') },
        { key: 'injectable', label: 'Injectables', match: code => code.startsWith('injectable') },
        { key: 'pill', label: 'Pilules', match: code => ['coc', 'pop', 'emergency'].includes(code) },
        { key: 'condom', label: 'Préservatifs', match: code => code === 'condom' },
        { key: 'other', label: 'Autres méthodes', match: () => true }
    ];
    let cypSequence = 0;
    let cypState = null;
    let cypTab = 'products';
    let statsPrintOpen = false;

    function cypValue(value) {
        // Espace insécable ordinaire : l'espace fine (U+202F) n'est pas dessinée par la police des grands chiffres.
        return Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace(/ /g, ' ');
    }

    function cypFactor(value) {
        return value === null || value === undefined ? '—' : Number(value).toLocaleString('fr-FR', { maximumSignificantDigits: 3 });
    }

    function cypShare(part, total) {
        return total > 0 ? dsPercent(Number(part || 0), total) : '—';
    }

    function cypFamily(code) {
        return CYP_FAMILIES.find(family => family.match(String(code || ''))) || CYP_FAMILIES.at(-1);
    }

    function clearCyp() {
        cypState = null;
        for (const id of ['cyp-summary', 'cyp-months', 'cyp-methods', 'cyp-table', 'cyp-unmapped']) $(id).replaceChildren();
        $('cyp-export').disabled = true;
        $('cyp-print').disabled = true;
    }

    async function refreshCyp() {
        const port = portSelect.value, sequence = ++cypSequence, requestGeneration = sessionGeneration;
        const status = $('cyp-status');
        clearCyp();
        $('cyp-populations').hidden = cypTab !== 'districts' || !hasRole(POPULATION_ROLES);
        // Portée commune à tout l'écran Statistiques (statsScopeAll, 05-statistiques-livraison.js).
        const all = statsScopeAll();
        if (!port && !all) { status.textContent = 'Aucun site disponible.'; return; }
        const period = statsPeriod();
        if (period.error) { status.textContent = period.error; return; }
        const csbOnly = !$('cyp-include-other').checked;
        status.textContent = 'Calcul des CAP…';
        try {
            const data = await api('/rest/v1/rpc/qbox_cyp_estimate', {
                selected_port: all ? null : port, from_date: period.from, to_date: period.to,
                source_filter: deliveryStatsSource, csb_only: csbOnly
            }, true);
            if (sequence !== cypSequence || activeView !== 'statistics' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const scope = statsScopeLabel(all);
            const source = { all: 'toutes origines', app: 'livraisons Q.box', legacy: 'sorties avant Q.box' }[deliveryStatsSource] || 'toutes origines';
            cypState = { data, period, scope, csbOnly, source };
            renderCyp();
            status.textContent = `${period.label} · ${scope} · ${csbOnly ? 'livraisons aux CSB' : 'tous les destinataires'} · ${source} · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === cypSequence && activeView === 'statistics' && sessionGeneration === requestGeneration)
                status.textContent = `Estimation des CAP indisponible : ${error.message}`;
        }
    }

    function renderCyp() {
        const { data } = cypState;
        const totals = data.totals || {};
        renderCypSummary(totals, data.months || []);
        renderCypMonths(data.months || []);
        renderCypMethods(data.products || [], Number(totals.cyp || 0));
        renderCypTable();
        const unmapped = data.unmapped || [];
        const note = $('cyp-unmapped');
        if (unmapped.length) {
            note.append(dsIcon('ph-info'), dsElement('span', '',
                `Méthode CAP à renseigner dans la fiche de l’intrant (méthode, ou « Non contraceptif ») — non comptés : ${unmapped.map(item => `${item.name} (${dsNumber(item.quantity)})`).join(', ')}.`));
        }
        const empty = !(data.products || []).length;
        $('cyp-export').disabled = empty;
        $('cyp-print').disabled = empty;
    }

    function cypCardHead(icon, title, text) {
        const head = dsElement('div', 'ds-cyp-card-head');
        const label = dsElement('div');
        label.append(dsElement('h5', '', title), dsElement('p', '', text));
        head.append(dsIcon(icon), label);
        return head;
    }

    function renderCypSummary(totals, months) {
        const kpi = (icon, tone, label, value, hint) => {
            const card = dsElement('div', `ds-cyp-kpi ds-cyp-tone-${tone}`);
            const head = dsElement('span', 'ds-cyp-kpi-label');
            head.append(dsIcon(icon), dsElement('span', '', label));
            card.append(head, dsElement('strong', 'ds-cyp-kpi-value', value), dsElement('span', 'ds-cyp-kpi-hint', hint));
            return card;
        };
        const period = totals.first_date ? `Du ${dsDate(totals.first_date)} au ${dsDate(totals.last_date)}` : 'Aucune livraison comptée';
        const main = dsElement('div', 'ds-cyp-kpi ds-cyp-kpi-main');
        const head = dsElement('span', 'ds-cyp-kpi-label');
        head.append(dsIcon('ph-shield-check'), dsElement('span', '', 'CAP livrés (estimation)'));
        const value = dsElement('strong', 'ds-cyp-kpi-value', cypValue(totals.cyp));
        value.append(dsElement('small', '', 'CAP'));
        main.append(head, value, dsElement('span', 'ds-cyp-kpi-hint', period));
        const active = months.filter(month => Number(month.cyp) > 0);
        if (active.length) {
            const average = active.reduce((sum, month) => sum + Number(month.cyp), 0) / active.length;
            main.append(dsElement('span', 'ds-cyp-kpi-pill', `≈ ${cypValue(average)} CAP par mois livré (${active.length} mois)`));
        }
        $('cyp-summary').replaceChildren(main,
            kpi('ph-first-aid-kit', 'blue', cypState.csbOnly ? 'CSB desservis' : 'Destinataires', dsNumber(totals.destinations), `${dsNumber(totals.deliveries)} livraison(s)`),
            kpi('ph-map-pin-area', 'violet', 'Districts', dsNumber(totals.districts), 'couverts sur la période'),
            kpi('ph-pill', 'amber', 'Intrants comptés', dsNumber(totals.products), 'avec une méthode contraceptive'));
    }

    function renderCypMonths(months) {
        const container = $('cyp-months');
        const values = months.map(month => Number(month.cyp) || 0);
        const max = Math.max(...values, 0);
        container.append(cypCardHead('ph-chart-bar', 'Évolution mensuelle', 'CAP livrés chaque mois · survolez une barre pour la valeur.'));
        if (!months.length || max <= 0) {
            container.append(dsElement('p', 'ds-empty', 'Aucun CAP livré sur cette période.'));
            return;
        }
        const active = values.filter(value => value > 0);
        const average = active.reduce((sum, value) => sum + value, 0) / active.length;
        const best = values.indexOf(max);
        const chart = dsElement('div', 'ds-cyp-chart');
        const axis = dsElement('div', 'ds-cyp-axis');
        axis.setAttribute('aria-hidden', 'true');
        for (const ratio of [1, .5]) {
            const tick = dsElement('span', 'ds-cyp-tick', cypValue(max * ratio));
            tick.style.bottom = `${ratio * 100}%`;
            axis.append(tick);
        }
        const mean = dsElement('span', 'ds-cyp-mean');
        mean.append(dsElement('span', '', `Moyenne ${cypValue(average)}`));
        mean.style.bottom = `${average * 100 / max}%`;
        axis.append(mean);
        const list = dsElement('ol', months.length > 12 ? 'ds-cyp-bars ds-cyp-bars-dense' : 'ds-cyp-bars');
        list.setAttribute('aria-label', 'CAP livrés par mois');
        months.forEach((month, index) => {
            const item = dsElement('li', index === best ? 'ds-cyp-bar ds-cyp-bar-best' : 'ds-cyp-bar');
            const label = `${dsMonth(month.month, true)} : ${cypValue(month.cyp)} CAP`;
            item.title = label;
            item.tabIndex = 0;
            item.setAttribute('aria-label', label);
            const bar = dsElement('span', 'ds-cyp-bar-fill');
            bar.style.height = `${values[index] > 0 ? Math.max(2, values[index] * 100 / max) : 0}%`;
            const tip = dsElement('span', 'ds-cyp-bar-tip');
            tip.append(dsElement('b', '', cypValue(month.cyp)), dsElement('span', '', dsMonth(month.month, true)));
            tip.setAttribute('aria-hidden', 'true');
            const track = dsElement('span', 'ds-cyp-bar-track');
            track.append(bar, tip);
            // Étiquettes : toutes jusqu'à 12 mois, sinon une sur trois (CSS), toujours avec l'année.
            item.append(track, dsElement('span', 'ds-cyp-bar-label', `${dsMonth(month.month)} ${String(month.month).slice(2, 4)}`));
            list.append(item);
        });
        chart.append(axis, list);
        const foot = dsElement('p', 'ds-cyp-chart-foot');
        foot.append(dsIcon('ph-trophy'), dsElement('span', '', `Meilleur mois : ${dsMonth(months[best].month, true)} (${cypValue(max)} CAP)`));
        container.append(chart, foot);
    }

    // Répartition des CAP par famille de méthodes : barre segmentée, légende avec valeurs, part de longue durée.
    function renderCypMethods(products, total) {
        const container = $('cyp-methods');
        container.append(cypCardHead('ph-chart-pie-slice', 'Répartition par méthode', 'Part des CAP livrés par famille de méthodes contraceptives.'));
        const groups = new Map();
        for (const product of products) {
            const family = cypFamily(product.method);
            const group = groups.get(family.key) || { family, cyp: 0, names: [] };
            group.cyp += Number(product.cyp || 0);
            group.names.push(product.name);
            groups.set(family.key, group);
        }
        const rows = CYP_FAMILIES.map(family => groups.get(family.key)).filter(group => group && group.cyp > 0);
        if (!rows.length || total <= 0) {
            container.append(dsElement('p', 'ds-empty', 'Aucun CAP livré sur cette période.'));
            return;
        }
        const bar = dsElement('div', 'ds-cyp-mix');
        bar.setAttribute('aria-hidden', 'true');
        const list = dsElement('ul', 'ds-cyp-mix-keys');
        for (const group of rows) {
            const segment = dsElement('span', `ds-cyp-seg ds-cyp-f-${group.family.key}`);
            segment.style.flexGrow = String(group.cyp);
            segment.title = `${group.family.label} : ${cypValue(group.cyp)} CAP (${dsPercent(group.cyp, total)})`;
            bar.append(segment);
            const item = dsElement('li', `ds-cyp-mix-key ds-cyp-f-${group.family.key}`);
            item.title = group.names.join(', ');
            const name = dsElement('span', 'ds-cyp-mix-name');
            name.append(dsElement('i', 'ds-cyp-swatch'), dsElement('span', '', group.family.label));
            const meter = dsElement('span', 'ds-cyp-mix-meter');
            const fill = dsElement('i');
            fill.style.width = `${Math.min(100, group.cyp * 100 / total)}%`;
            meter.append(fill);
            item.append(name, meter, dsElement('b', '', cypValue(group.cyp)), dsElement('span', 'ds-cyp-mix-share', dsPercent(group.cyp, total)));
            list.append(item);
        }
        const long = rows.filter(group => group.family.long).reduce((sum, group) => sum + group.cyp, 0);
        const note = dsElement('p', 'ds-cyp-chart-foot');
        note.append(dsIcon('ph-hourglass-medium'), dsElement('span', '', `Méthodes de longue durée (implants, DIU) : ${dsPercent(long, total)} des CAP`));
        container.append(bar, list, note);
    }

    function setCypTab(key) {
        cypTab = key;
        for (const tab of CYP_TABS) $(`cyp-tab-${tab.key}`).setAttribute('aria-selected', String(tab.key === key));
        $('cyp-search-wrap').hidden = key !== 'destinations';
        $('cyp-populations').hidden = key !== 'districts' || !hasRole(POPULATION_ROLES);
        renderCypTable();
    }

    // Lignes du tableau d'un onglet : [cellules], la dernière cellule numérique est le CAP.
    function cypRows(data, key, query = '') {
        const total = Number(data.totals?.cyp || 0);
        if (key === 'products') {
            return {
                head: ['Intrant', 'Méthode', 'Facteur (CAP / unité)', 'Quantité livrée', 'CAP', 'Part'],
                rows: (data.products || []).map(item => [item.name,
                    { text: item.method_label || '—', family: cypFamily(item.method).key }, cypFactor(item.factor),
                    `${dsNumber(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`, cypValue(item.cyp), cypShare(item.cyp, total)]),
                numeric: [2, 3, 4], total
            };
        }
        if (key === 'districts') {
            return {
                // Femmes en âge de procréer (population de référence du district) : CAP pour 1 000 femmes sur la période.
                head: ['District', cypState?.csbOnly === false ? 'Destinataires' : 'CSB desservis', 'Livraisons',
                    'Femmes 15-49 ans', 'CAP / 1 000 femmes', 'CAP', 'Part'],
                rows: (data.districts || []).map(item => [item.district, dsNumber(item.destinations), dsNumber(item.deliveries),
                    item.women ? `${dsNumber(item.women)}${item.women_year ? ` (${item.women_year})` : ''}` : '—',
                    item.women ? cypValue(Number(item.cyp) * 1000 / Number(item.women)) : '—',
                    cypValue(item.cyp), cypShare(item.cyp, total)]),
                numeric: [1, 2, 3, 4, 5], total
            };
        }
        const search = query.trim().toLocaleLowerCase('fr-FR');
        const names = new Map((data.products || []).map(item => [item.product_id, item.name]));
        return {
            head: ['CSB', 'District', 'Livraisons', 'Principal intrant', 'CAP', 'Part'],
            rows: (data.destinations || [])
                .filter(item => !search || `${item.name} ${item.district}`.toLocaleLowerCase('fr-FR').includes(search))
                .map(item => [item.name, item.district, dsNumber(item.deliveries),
                    names.get(item.products?.[0]?.product_id) || '—', cypValue(item.cyp), cypShare(item.cyp, total)]),
            numeric: [2, 4], total
        };
    }

    function cypTableElement(table, { head, rows, numeric, total }, emptyText, withBars = true) {
        const thead = dsElement('thead');
        const header = dsElement('tr');
        head.forEach((label, index) => header.append(dsElement('th', numeric.includes(index) || index === head.length - 1 ? 'ds-num' : '', label)));
        thead.append(header);
        const tbody = dsElement('tbody');
        for (const cells of rows) {
            const tr = dsElement('tr');
            cells.forEach((value, index) => {
                const cell = dsElement('td', numeric.includes(index) || index === cells.length - 1 ? 'ds-num' : '');
                if (index === cells.length - 1 && withBars) {
                    cell.className = 'ds-num ds-cyp-share';
                    const bar = dsElement('span', 'ds-cyp-share-bar');
                    const fill = dsElement('i');
                    fill.style.width = value === '—' ? '0%' : `${Math.min(100, Number(String(value).replace(/[^\d,]/g, '').replace(',', '.')) || 0)}%`;
                    bar.append(fill);
                    cell.append(bar, dsElement('span', '', value));
                } else if (value && typeof value === 'object') {
                    // Méthode : pastille de la famille (même couleur que la répartition) puis libellé.
                    const chip = dsElement('span', `ds-cyp-method ds-cyp-f-${value.family}`);
                    chip.append(dsElement('i', 'ds-cyp-swatch'), dsElement('span', '', value.text));
                    cell.append(chip);
                } else cell.textContent = value;
                if (index === 0) cell.className = 'ds-cyp-name';
                tr.append(cell);
            });
            tbody.append(tr);
        }
        if (!rows.length) {
            const tr = dsElement('tr');
            const cell = dsElement('td', 'ds-empty', emptyText);
            cell.colSpan = head.length;
            tr.append(cell);
            tbody.append(tr);
        } else {
            const tr = dsElement('tr', 'ds-cyp-total');
            head.forEach((_, index) => tr.append(dsElement('td', index === head.length - 2 ? 'ds-num' : '',
                index === 0 ? 'Total' : index === head.length - 2 ? cypValue(total) : '')));
            tbody.append(tr);
        }
        table.replaceChildren(thead, tbody);
        return table;
    }

    function renderCypTable() {
        const table = $('cyp-table');
        if (!cypState) { table.replaceChildren(); return; }
        const query = cypTab === 'destinations' ? String($('cyp-search').value ?? '') : '';
        const model = cypRows(cypState.data, cypTab, query);
        // Avec une recherche, le total affiché reste celui de toute la période (part calculée sur le grand total).
        cypTableElement(table, model, query.trim() ? 'Aucun CSB ne correspond à la recherche.' : 'Aucun CAP livré sur cette période.');
    }

    function exportCyp() {
        if (!cypState) return;
        const label = CYP_TABS.find(tab => tab.key === cypTab)?.label || '';
        downloadTableCsv($('cyp-table'), tableCsvFileName(`cap-livres-${label}`, cypState.scope));
    }

    function openCypPrint() {
        if (!cypState) return;
        const { data, period, scope, csbOnly, source } = cypState;
        const report = $('stats-print-content');
        report.replaceChildren(planningPrintHeader('COUPLES-ANNÉE DE PROTECTION LIVRÉS', null, { name: scope },
            `Période : ${period.label}`));
        report.append(dsElement('h1', '', 'Estimation des Couples-Année de Protection (CAP) livrés'),
            dsElement('p', '', `${scope} · ${period.label} · ${csbOnly ? 'livraisons aux CSB' : 'tous les destinataires'} · ${source}.`),
            dsElement('p', '', 'CAP = quantité livrée × facteur de conversion standard de la méthode (document « Facteurs de conversion standards »). '
                + 'Il s’agit des CAP livrés aux structures, et non des CAP des clientes servies.'),
            dsElement('p', 'stats-print-total', `Total : ${cypValue(data.totals?.cyp)} CAP · ${dsNumber(data.totals?.destinations)} destinataire(s) · ${dsNumber(data.totals?.districts)} district(s)`));
        for (const tab of CYP_TABS) {
            report.append(dsElement('h2', '', tab.label));
            report.append(cypTableElement(dsElement('table'), cypRows(data, tab.key), 'Aucune donnée.', false));
        }
        const unmapped = data.unmapped || [];
        if (unmapped.length) report.append(dsElement('p', '', `Non comptés (sans méthode CAP) : ${unmapped.map(item => `${item.name} (${dsNumber(item.quantity)})`).join(', ')}.`));
        showStatsPrint('Aperçu · Couples-Année de Protection livrés');
    }

    // Ouvre l'aperçu commun de l'écran Statistiques (statistiques de livraison ou CAP), contenu déjà rempli.
    function showStatsPrint(title) {
        $('stats-print-title').textContent = title;
        statsPrintOpen = true;
        portSelect.disabled = true;
        $('modal-backdrop').classList.remove('hidden');
        $('stats-print-modal').classList.remove('hidden');
    }

    async function printStats() {
        if (!statsPrintOpen) return;
        // Attendre le logo pour qu'il figure sur la page imprimée (impression maintenue en cas d'échec).
        try { await $('stats-print-content').querySelector('.planning-print-logo')?.decode?.(); } catch { /* logo indisponible */ }
        if (!statsPrintOpen) return;
        document.body.classList.add('stats-print-mode');
        window.print();
    }

    function closeStatsPrint() {
        statsPrintOpen = false;
        $('stats-print-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('stats-print-content').replaceChildren();
        document.body.classList.remove('stats-print-mode');
        portSelect.disabled = false;
    }

    // ---------- Populations de référence des districts (CAP pour 1 000 femmes) ----------
    const POPULATION_ROLES = ['admin', 'logistics'];
    let populationRows = null;
    let populationSaving = false;

    async function openPopulations() {
        if (!hasRole(POPULATION_ROLES) || populationRows || populationSaving) return;
        const requestGeneration = sessionGeneration;
        $('population-status').textContent = 'Chargement des districts…';
        $('population-rows').replaceChildren();
        $('modal-backdrop').classList.remove('hidden');
        $('population-modal').classList.remove('hidden');
        populationRows = [];
        try {
            const districts = await api('/rest/v1/rpc/qbox_list_district_populations', {}, true);
            if (sessionGeneration !== requestGeneration || !populationRows) return;
            const year = Number(new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo', year: 'numeric' }).format(new Date()));
            for (const district of districts || []) {
                const tr = dsElement('tr', 'border-t border-slate-100');
                const women = dsElement('input', 'w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono');
                women.type = 'number';
                women.min = '1';
                women.step = '1';
                women.value = district.women ?? '';
                women.setAttribute('aria-label', `Femmes 15-49 ans, district ${district.district}`);
                const reference = dsElement('input', 'w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono');
                reference.type = 'number';
                reference.min = '2000';
                reference.max = '2100';
                reference.value = district.reference_year ?? year;
                reference.setAttribute('aria-label', `Année de référence, district ${district.district}`);
                const cell = control => { const td = dsElement('td', 'py-2 pr-2'); td.append(control); return td; };
                tr.append(dsElement('td', 'py-2 pr-2 font-bold text-slate-900', district.district),
                    dsElement('td', 'py-2 pr-2', String(district.csbs ?? 0)), cell(women), cell(reference));
                $('population-rows').append(tr);
                populationRows.push({ district: district.district, women, reference,
                    original: `${district.women ?? ''}|${district.women ? district.reference_year ?? '' : ''}` });
            }
            $('population-status').textContent = populationRows.length ? '' : 'Aucun district : renseignez d’abord le district des CSB.';
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('population-status').textContent = `Lecture impossible : ${error.message}`;
        }
    }

    function closePopulations() {
        if (populationSaving) return;
        populationRows = null;
        $('population-modal').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        $('population-rows').replaceChildren();
    }

    async function submitPopulations(event) {
        event.preventDefault();
        if (!populationRows || populationSaving) return;
        const changes = [];
        for (const row of populationRows) {
            const womenText = String(row.women.value ?? '').trim();
            const women = womenText ? Number(womenText) : null;
            const year = womenText ? Number(row.reference.value) : null;
            if (women !== null && (!Number.isSafeInteger(women) || women <= 0 || !Number.isInteger(year) || year < 2000 || year > 2100)) {
                $('population-status').textContent = `District ${row.district} : effectif entier positif et année entre 2000 et 2100 requis.`;
                return;
            }
            if (`${women ?? ''}|${women === null ? '' : year}` !== row.original) changes.push({ district: row.district, women, year });
        }
        if (!changes.length) { closePopulations(); return; }
        const requestGeneration = sessionGeneration;
        populationSaving = true;
        $('population-submit').disabled = true;
        $('population-status').textContent = 'Enregistrement…';
        try {
            for (const change of changes) {
                await api('/rest/v1/rpc/qbox_set_district_population',
                    { district_name: change.district, women: change.women, reference_year: change.year }, true);
                if (sessionGeneration !== requestGeneration) return;
            }
            populationSaving = false;
            closePopulations();
            refreshCyp();
        } catch (error) {
            if (sessionGeneration === requestGeneration) $('population-status').textContent = `${error.message} Les districts précédents sont enregistrés.`;
        } finally {
            if (sessionGeneration === requestGeneration) {
                populationSaving = false;
                $('population-submit').disabled = false;
            }
        }
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

    // Classes partagées des actions de livraison (vols, expéditions terrestres, historique).
    // L'icône d'un bouton dépend de data-icon (modern-theme.css), pas de sa classe.
    const DELIVERY_BUTTON = {
        primary: 'dl-btn dl-btn-primary',
        danger: 'dl-btn dl-btn-danger',
        secondary: 'dl-btn dl-btn-secondary',
        neutral: 'dl-btn dl-btn-neutral'
    };

    function deliveryButton(label, tone, icon, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = DELIVERY_BUTTON[tone];
        if (icon) button.dataset.icon = icon;
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    function deliveryStatusBadge(status) {
        const text = String(status || '');
        const tone = /annul/i.test(text) ? 'cancelled' : /clôtur|livr/i.test(text) ? 'done' : /en vol|en cours/i.test(text) ? 'flight' : 'neutral';
        const badge = document.createElement('span');
        badge.className = `dl-status dl-status-${tone}`;
        badge.textContent = text;
        return badge;
    }

    function deliveryElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    // Vols en cours affichés, pour la recherche sans relire le serveur.
    let droneFilterState = null;

    // Vols en cours : indicateurs, puis vols regroupés par district et par CSB (colisage, BL, actions).
    // csbs === null (lecture impossible) : regroupement par CSB seulement.
    function renderDroneFlights(container, rows, csbs, view) {
        const csbInfo = new Map((csbs || []).map(csb => [csb.id, csb]));
        const itemUnits = flight => flight.items.reduce((sum, item) => sum + BigInt(item.quantity ?? 0), 0n);
        const units = rows.reduce((sum, flight) => sum + itemUnits(flight), 0n);
        const products = new Set(rows.flatMap(flight => flight.items.map(item => item.product_name || item.name)));
        const kpis = [];
        for (const [label, value, hint, tone, icon] of [
            ['Colis en vol', number(rows.length), 'Vols à clôturer à réception', 'primary', 'ph-paper-plane-tilt'],
            ['CSB desservis', number(new Set(rows.map(flight => flight.csb_id)).size), 'Destinations en cours', 'teal', 'ph-first-aid-kit'],
            ['Unités transportées', number(units), 'Tous intrants confondus', 'accent', 'ph-package'],
            ['Intrants distincts', number(products.size), 'Dans les colis en vol', 'violet', 'ph-pill']
        ]) {
            const kpi = deliveryElement('div', `dl-kpi dl-tone-${tone}`);
            const badge = deliveryElement('span', 'dl-kpi-icon');
            const glyph = deliveryElement('i', `ph ${icon}`);
            glyph.setAttribute('aria-hidden', 'true');
            badge.append(glyph);
            const text = deliveryElement('div', 'dl-kpi-text');
            text.append(deliveryElement('span', 'dl-kpi-label', label), deliveryElement('strong', 'dl-kpi-value', value), deliveryElement('span', 'dl-kpi-hint', hint));
            kpi.append(badge, text);
            kpis.push(kpi);
        }
        $('drones-summary').replaceChildren(...kpis);
        droneFilterState = {flights: [], csbs: [], districts: [], empty: null};
        if (!rows.length) {
            const empty = deliveryElement('div', 'dl-empty');
            const glyph = deliveryElement('i', 'ph ph-paper-plane-tilt');
            glyph.setAttribute('aria-hidden', 'true');
            empty.append(glyph, deliveryElement('strong', '', 'Aucune rotation drone en cours.'),
                deliveryElement('span', '', 'Les colis apparaissent ici dès qu’une mission est lancée, jusqu’à leur clôture à réception.'));
            container.append(empty);
            return;
        }
        // District → CSB → vols ; districts par ordre alphabétique (non renseigné en dernier), vols du plus ancien au plus récent.
        const districts = new Map();
        for (const flight of rows) {
            const csb = csbInfo.get(flight.csb_id);
            const district = csbs ? csb?.district || NO_DISTRICT : '';
            if (!districts.has(district)) districts.set(district, new Map());
            const groups = districts.get(district);
            if (!groups.has(flight.csb_id)) groups.set(flight.csb_id, {name: flight.csb_name, csb, flights: []});
            groups.get(flight.csb_id).flights.push(flight);
        }
        const districtOrder = [...districts.keys()].sort((a, b) => a === NO_DISTRICT ? 1 : b === NO_DISTRICT ? -1 : a.localeCompare(b, 'fr'));
        for (const district of districtOrder) {
            const groups = [...districts.get(district).values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
            const districtBox = deliveryElement('section', district === NO_DISTRICT ? 'dl-district dl-district-none' : 'dl-district');
            const districtState = {element: districtBox, csbs: []};
            if (csbs) {
                const head = deliveryElement('div', 'dl-district-head');
                const name = deliveryElement('h3', 'dl-district-name');
                const glyph = deliveryElement('i', 'ph ph-map-pin-area');
                glyph.setAttribute('aria-hidden', 'true');
                name.append(glyph, deliveryElement('span', '', district));
                const parcels = groups.reduce((sum, group) => sum + group.flights.length, 0);
                head.append(name, deliveryElement('span', 'dl-district-count', `${groups.length} CSB · ${parcels} colis`));
                districtBox.append(head);
            }
            for (const group of groups) {
                const section = deliveryElement('article', 'dl-csb');
                const csbState = {element: section, flights: []};
                const header = deliveryElement('div', 'dl-csb-head');
                const heading = deliveryElement('div', 'dl-csb-heading');
                heading.append(deliveryElement(csbs ? 'h4' : 'h3', 'dl-csb-name', group.name));
                const distance = Number(group.csb?.distance_km);
                if (group.csb && Number.isFinite(distance) && distance > 0)
                    heading.append(deliveryElement('span', 'dl-csb-meta', `${distance.toLocaleString('fr-FR')} km`));
                const badges = deliveryElement('div', 'dl-csb-badges');
                for (const code of new Set(group.flights.map(flight => flight.planning_code).filter(Boolean)))
                    badges.append(deliveryElement('span', 'dl-chip', `Planning ${code}`));
                badges.append(deliveryElement('span', 'dl-count', `${group.flights.length} colis`));
                header.append(heading, badges);
                section.append(header);
                const flights = [...group.flights].sort((a, b) => String(a.departed_at || '').localeCompare(String(b.departed_at || '')) || String(a.bl).localeCompare(String(b.bl)));
                for (const flight of flights) {
                    const card = deliveryElement('div', 'dl-flight');
                    const reference = deliveryElement('div', 'dl-ref');
                    reference.append(deliveryElement('span', 'dl-ref-label', 'N° BL'), deliveryElement('span', 'dl-ref-value', flight.bl),
                        deliveryElement('span', 'dl-ref-date', `Départ : ${localDateTime(flight.departed_at)} (Madagascar)`), deliveryStatusBadge('En cours de livraison'));
                    const cargo = deliveryElement('div', 'dl-cargo');
                    const chips = deliveryElement('div', 'dl-items');
                    for (const item of flight.items) {
                        const chip = deliveryElement('span', 'dl-item');
                        chip.append(deliveryElement('strong', '', number(item.quantity)), deliveryElement('span', '', `${item.product_name || item.name} · Lot ${item.lot}`));
                        chips.append(chip);
                    }
                    if (!flight.items.length) chips.append(deliveryElement('span', 'dl-items-empty', 'Aucun détail'));
                    cargo.append(chips);
                    if (flight.items.length) cargo.append(deliveryElement('span', 'dl-cargo-total', `Total : ${number(itemUnits(flight))} unité(s) · ${flight.items.length} ligne(s)`));
                    const actions = deliveryElement('div', 'dl-actions');
                    if (hasRole(['admin', 'pilot'])) {
                        actions.append(deliveryButton('Clôturer ce vol', 'primary', 'check', () => openDeliveryClose('drones', flight.id)),
                            deliveryButton('Modifier ce vol', 'secondary', 'edit', () => openDeliveryEdit('drones', flight.id)));
                    }
                    actions.append(deliveryButton('Aperçu du BL', 'neutral', 'print', () => openDeliveryPrint('drones', flight.id)));
                    if (hasRole(['admin', 'pilot'])) actions.append(deliveryButton('Annuler ce vol', 'danger', 'cancel', () => openDeliveryClose('drones', flight.id, 'cancel')));
                    const footer = deliveryElement('div', 'dl-flight-history');
                    appendDeliveryHistory(footer, view, flight.id, 'dl-link');
                    card.append(reference, cargo, actions, footer);
                    section.append(card);
                    csbState.flights.push({element: card, search: [flight.bl, flight.csb_name, district, flight.planning_code,
                        ...flight.items.flatMap(item => [item.product_name || item.name, item.lot])].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR')});
                }
                districtBox.append(section);
                districtState.csbs.push(csbState);
            }
            container.append(districtBox);
            droneFilterState.districts.push(districtState);
        }
        droneFilterState.container = container;
        filterDroneFlights();
    }

    // Recherche par BL, CSB, district, planning, intrant ou lot ; masque les CSB et districts sans vol visible.
    function filterDroneFlights() {
        if (!droneFilterState) return;
        const query = String($('drones-search').value ?? '').trim().toLocaleLowerCase('fr-FR');
        let shown = 0;
        for (const district of droneFilterState.districts) {
            let districtShown = 0;
            for (const csb of district.csbs) {
                let csbShown = 0;
                for (const flight of csb.flights) {
                    flight.element.hidden = Boolean(query) && !flight.search.includes(query);
                    if (!flight.element.hidden) csbShown += 1;
                }
                csb.element.hidden = csbShown === 0;
                districtShown += csbShown;
            }
            district.element.hidden = districtShown === 0;
            shown += districtShown;
        }
        // Message « aucun résultat » ajouté seulement quand une recherche ne trouve rien.
        const noMatch = shown === 0 && droneFilterState.districts.length > 0;
        if (noMatch && !droneFilterState.empty && droneFilterState.container) {
            droneFilterState.empty = deliveryElement('p', 'dl-no-match', 'Aucun vol ne correspond à la recherche.');
            droneFilterState.container.append(droneFilterState.empty);
        }
        if (droneFilterState.empty) droneFilterState.empty.hidden = !noMatch;
    }

    // Libellés des colonnes (affichage en cartes sur petit écran : data-label).
    const DELIVERY_ROW_LABELS = {
        history: ['N° BL', 'Date clôture', 'CSB livré', 'Intrants largués', 'Statut'],
        sorties: ['Référence', 'Expédition', 'CSB', 'Transport', 'Intrants', 'Statut']
    };

    // Ligne du registre des clôtures (history) ou des expéditions terrestres (sorties).
    function deliveryTableRow(view, entry) {
        const labels = DELIVERY_ROW_LABELS[view];
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        const values = view === 'history'
            ? [entry.bl, entry.closed_date || 'Non renseignée', entry.csb_name, cargo(entry.items), entry.status]
            : [entry.reference, localDateTime(entry.dispatched_at), entry.csb_name, entry.transport, cargo(entry.items), entry.status];
        const statusIndex = values.length - 1;
        values.forEach((value, index) => {
            const cell = document.createElement('td');
            cell.className = 'py-3 px-4 text-slate-700';
            cell.dataset.label = labels[index];
            if (index === statusIndex) cell.append(deliveryStatusBadge(value)); else cell.textContent = value;
            tr.append(cell);
        });
        tr.children[0].className += ' font-mono font-bold';
        tr.children[2].className += ' font-bold text-slate-900';
        tr.append(deliveryActionsCell(view, entry));
        return tr;
    }

    // Cellule « Actions » d'une ligne du registre des clôtures ou des expéditions terrestres.
    function deliveryActionsCell(view, entry) {
        const cell = document.createElement('td');
        cell.className = 'py-3 px-4 text-right';
        cell.dataset.label = 'Actions';
        const actions = document.createElement('div');
        actions.className = 'flex flex-wrap justify-end items-center gap-2';
        if (view === 'sorties' && entry.status === 'En cours' && hasRole(['admin', 'logistics'])) {
            const close = document.createElement('button');
            close.type = 'button';
            close.className = DELIVERY_BUTTON.primary;
            close.dataset.icon = 'check';
            close.textContent = 'Clôturer';
            close.addEventListener('click', () => openDeliveryClose('sorties', entry.id));
            actions.append(close);
            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.className = DELIVERY_BUTTON.danger;
            cancel.dataset.icon = 'cancel';
            cancel.textContent = 'Annuler';
            cancel.addEventListener('click', () => openDeliveryClose('sorties', entry.id, 'cancel'));
            actions.append(cancel);
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = DELIVERY_BUTTON.secondary;
            edit.dataset.icon = 'edit';
            edit.textContent = 'Modifier';
            edit.addEventListener('click', () => openDeliveryEdit('sorties', entry.id));
            actions.append(edit);
        }
        if (entry.status !== 'Annulé') {
            const print = document.createElement('button');
            print.type = 'button';
            print.className = DELIVERY_BUTTON.neutral;
            print.dataset.icon = 'print';
            print.textContent = 'Aperçu du BL';
            print.addEventListener('click', () => openDeliveryPrint(view, entry.id));
            actions.append(print);
        }
        if (!['history', 'sorties'].includes(view) || userRole === 'admin') {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = DELIVERY_BUTTON.neutral;
            button.textContent = 'Opérations / BL';
            button.addEventListener('click', () => openOperations(operationSections[view]));
            actions.append(button);
        }
        cell.append(actions);
        const history = document.createElement('div');
        history.className = 'mt-2 text-right';
        appendDeliveryHistory(history, view, entry.id, DELIVERY_BUTTON.secondary);
        cell.append(history);
        return cell;
    }

    // ---------- Registre des clôtures : une ligne par vol, intrants regroupés par produit (lots en étiquettes) ----------
    const HC_WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    function hcToday() {
        return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date());
    }

    // Écart en jours entre deux dates ISO (AAAA-MM-JJ), sans fuseau.
    function hcDaysBetween(from, to) {
        return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
    }

    function hcRelative(day) {
        const days = hcDaysBetween(day, hcToday());
        if (!Number.isFinite(days)) return '';
        if (days <= 0) return 'aujourd’hui';
        if (days === 1) return 'hier';
        if (days < 7) return `il y a ${days} jours`;
        if (days < 60) return `il y a ${Math.round(days / 7)} sem.`;
        if (days < 730) return `il y a ${Math.round(days / 30.4)} mois`;
        return `il y a ${Math.floor(days / 365)} ans`;
    }

    // Départ du vol : « 27/11/2026 à 09:00 » (heure de Madagascar, sans les secondes).
    function hcDeparture(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        const day = date.toLocaleDateString('fr-FR', { timeZone: 'Indian/Antananarivo' });
        const time = date.toLocaleTimeString('fr-FR', { timeZone: 'Indian/Antananarivo', hour: '2-digit', minute: '2-digit' });
        return `${day} à ${time}`;
    }

    function hcLongDate(day) {
        const date = new Date(`${day}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) return String(day || '—');
        const text = `${HC_WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${DS_MONTHS_LONG[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // Intrants d'un vol regroupés par produit : quantité totale, lots et péremption.
    function hcProducts(items) {
        const products = new Map();
        for (const item of items || []) {
            const key = item.product_id || item.product_name;
            const product = products.get(key) || { name: item.product_name || item.name || 'Intrant', unit: item.unit || '', quantity: 0, lots: [] };
            product.quantity += Number(item.quantity || 0);
            product.lots.push(item);
            products.set(key, product);
        }
        return [...products.values()];
    }

    function hcCargo(items) {
        const products = hcProducts(items);
        const list = deliveryElement('ul', 'hc-cargo');
        if (!products.length) {
            list.append(deliveryElement('li', 'hc-cargo-empty', 'Aucun détail'));
            return list;
        }
        for (const product of products) {
            const item = deliveryElement('li', 'hc-cargo-item');
            const head = deliveryElement('div', 'hc-cargo-head');
            const quantity = deliveryElement('span', 'hc-qty');
            quantity.append(deliveryElement('b', '', number(product.quantity)));
            if (product.unit) quantity.append(deliveryElement('small', '', product.unit));
            head.append(deliveryElement('span', 'hc-cargo-name', product.name), quantity);
            const lots = deliveryElement('div', 'hc-lots');
            for (const lot of product.lots) {
                const chip = deliveryElement('span', 'hc-lot', `Lot ${lot.lot || '—'}`);
                const details = [`Lot ${lot.lot || '—'} : ${number(lot.quantity)}${product.unit ? ` ${product.unit}` : ''}`];
                if (lot.expiry_date) details.push(`péremption ${dsDate(lot.expiry_date)}`);
                chip.title = details.join(' · ');
                if (product.lots.length > 1) chip.append(deliveryElement('em', '', number(lot.quantity)));
                lots.append(chip);
            }
            item.append(head, lots);
            list.append(item);
        }
        if (products.length > 1) {
            const total = products.reduce((sum, product) => sum + product.quantity, 0);
            list.append(deliveryElement('li', 'hc-cargo-total', `${products.length} intrants · ${number(total)} unités au total`));
        }
        return list;
    }

    function closedFlightRow(entry) {
        const tr = deliveryElement('tr', entry.status === 'Annulé' ? 'hc-row hc-row-cancelled' : 'hc-row');
        const cell = (label, className = '') => { const td = deliveryElement('td', className); td.dataset.label = label; tr.append(td); return td; };
        const bl = cell('N° BL', 'hc-bl');
        bl.append(deliveryElement('span', 'hc-bl-code', entry.bl));
        if (entry.planning_code) {
            const planning = deliveryElement('span', 'hc-planning');
            planning.append(dsIcon('ph-clipboard-text'), deliveryElement('span', '', entry.planning_code));
            bl.append(planning);
        }
        const date = cell('Clôture', 'hc-date');
        if (entry.closed_date) {
            // Le jour relatif est déjà dans le séparateur : on montre plutôt le départ du vol.
            date.append(deliveryElement('b', '', dsDate(entry.closed_date)));
            if (entry.departed_at) date.append(deliveryElement('span', '', `départ ${hcDeparture(entry.departed_at)}`));
        } else {
            date.append(deliveryElement('b', 'hc-muted', 'Non renseignée'));
            if (entry.departed_at) date.append(deliveryElement('span', '', `départ le ${hcDeparture(entry.departed_at)}`));
        }
        const csb = cell('CSB livré', 'hc-csb');
        csb.append(deliveryElement('b', '', entry.csb_name || '—'));
        if (entry.district) {
            const district = deliveryElement('span', 'hc-district-chip');
            district.append(dsIcon('ph-map-pin'), deliveryElement('span', '', entry.district));
            csb.append(district);
        }
        cell('Intrants largués', 'hc-cargo-cell').append(hcCargo(entry.items));
        cell('Statut', 'hc-status-cell').append(deliveryStatusBadge(entry.status));
        tr.append(deliveryActionsCell('history', entry));
        return tr;
    }

    // Séparateur de jour (ligne fusionnée) : « Lundi 24 novembre 2026 · 3 vols », compteur mis à jour en pagination.
    function closedDaySeparator(day) {
        const tr = deliveryElement('tr', 'hc-day');
        const td = deliveryElement('td');
        td.colSpan = 6;
        const label = deliveryElement('span', 'hc-day-label');
        label.append(dsIcon('ph-calendar-check'), deliveryElement('b', '', hcLongDate(day)));
        const count = deliveryElement('span', 'hc-day-count');
        const relative = hcRelative(day);
        if (relative) label.append(deliveryElement('span', 'hc-day-relative', relative));
        td.append(label, count);
        tr.append(td);
        return { element: tr, count, flights: 0 };
    }

    async function refreshDeliveries(view, { keepLegacy = false } = {}) {
        const port = portSelect.value, sequence = ++requestSequence, requestGeneration = sessionGeneration;
        const container = $(view === 'drones' ? 'drones-groups' : view === 'history' ? 'history-table-body' : 'sorties-table-body');
        const message = $(`postgres-${view}-status`);
        container.replaceChildren();
        if (view === 'drones') { $('drones-summary').replaceChildren(); droneFilterState = null; }
        // Historique : sorties d'avant Q.box (05-statistiques-livraison.js) et registre des clôtures, paginé côté serveur.
        if (view === 'history') {
            if (!keepLegacy) refreshLegacyDeliveries(true);
            loadClosedFlights(true);
            return;
        }
        message.textContent = port ? 'Chargement…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const name = view === 'sorties' ? 'qbox_list_shipments' : 'qbox_list_flights';
            // Vols en cours : les CSB donnent le district et la distance ; sans eux, regroupement par CSB seulement.
            const [data, csbs] = await Promise.all([
                api(`/rest/v1/rpc/${name}`, { selected_port: port }, true),
                view === 'drones' ? api('/rest/v1/rpc/qbox_list_csbs', { selected_port: port }, true).catch(() => null) : null
            ]);
            if (sequence !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const rows = view === 'sorties' ? data : data.filter(flight => flight.status === 'En vol');
            if (view === 'drones') {
                renderDroneFlights(container, rows, csbs, view);
            } else {
                for (const entry of rows) container.append(deliveryTableRow(view, entry));
                if (!rows.length) container.append(emptyTableRow('Aucune expédition terrestre.', 7));
            }
            message.textContent = `${rows.length} ${view === 'sorties' ? 'expédition(s)' : 'vol(s)'} · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === requestSequence && activeView === view && port === portSelect.value && sessionGeneration === requestGeneration)
                message.textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    // ---------- Registre des vols clôturés (écran Historique) : qbox_list_closed_flights, 50 vols par page ----------
    const CLOSED_PAGE_SIZE = 50;
    let closedSequence = 0;
    let historyClosedState = null;

    async function loadClosedFlights(reset) {
        const port = portSelect.value, requestGeneration = sessionGeneration;
        const container = $('history-table-body'), message = $('postgres-history-status'), more = $('history-closed-more');
        if (reset) {
            // Un autre site : le district choisi n'y existe sans doute pas, on repart de « Tous les districts ».
            if (historyClosedState && historyClosedState.port !== port) resetHistoryClosedDistrict();
            historyClosedState = { port, period: historyClosedPeriod(), district: $('history-closed-district').value || null, offset: 0, day: null };
            container.replaceChildren();
            $('history-closed-summary').replaceChildren();
            $('history-closed-count').textContent = '';
        }
        const state = historyClosedState;
        more.hidden = true;
        if (!state) return;
        if (state.period.error) { message.textContent = state.period.error; return; }
        if (!port) { message.textContent = 'Aucun port disponible.'; return; }
        const sequence = ++closedSequence;
        message.textContent = 'Chargement…';
        try {
            const data = await api('/rest/v1/rpc/qbox_list_closed_flights', {
                selected_port: port, from_date: state.period.from, to_date: state.period.to,
                page_limit: CLOSED_PAGE_SIZE, page_offset: state.offset, district_filter: state.district
            }, true);
            if (state !== historyClosedState || sequence !== closedSequence || activeView !== 'history' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const rows = data.rows || [];
            if (!state.offset) {
                applyHistoryClosedMeta(data);
                renderHistoryClosedSummary(data.summary);
            }
            for (const entry of rows) {
                const day = entry.day || entry.closed_date || String(entry.departed_at || '').slice(0, 10);
                if (!state.day || state.day.key !== day) {
                    state.day = { key: day, ...closedDaySeparator(day) };
                    container.append(state.day.element);
                }
                state.day.flights += 1;
                state.day.count.textContent = `${state.day.flights} vol${state.day.flights > 1 ? 's' : ''}`;
                container.append(closedFlightRow(entry));
            }
            state.offset += rows.length;
            const total = Number(data.total || 0);
            const filtered = Boolean(state.period.from || state.period.to || state.district);
            if (!state.offset) container.append(emptyTableRow(filtered ? 'Aucun vol clôturé pour ces filtres.' : 'Aucun vol dans l’historique.', 6));
            more.hidden = state.offset >= total;
            if (!more.hidden) more.replaceChildren(dsIcon('ph-arrow-down'), deliveryElement('span', '',
                `Afficher ${number(Math.min(CLOSED_PAGE_SIZE, total - state.offset))} vols de plus (${number(total - state.offset)} restants)`));
            $('history-closed-count').textContent = `${number(total)} vol(s)`;
            const scope = [state.period.from || state.period.to ? state.period.label : '', state.district ? `District ${state.district}` : ''].filter(Boolean).join(' · ');
            message.textContent = `${state.offset < total ? `${number(state.offset)} affiché(s) sur ` : ''}${number(total)} vol(s)`
                + `${scope ? ` · ${scope}` : ''} · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (state === historyClosedState && sequence === closedSequence && activeView === 'history' && sessionGeneration === requestGeneration)
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

    // --- Saisie des vols : cartes numérotées, lignes compactes, disponibilité des lots en direct ---
    // Les colis sont suivis en mémoire ; la soumission relit les champs nommés stock / quantity du formulaire.
    const FLIGHT_ITEM_GRID = 'grid grid-cols-[minmax(0,1fr)_7rem_2rem] gap-2';
    let flightParcels = [];

    function flightElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function flightIconButton(icon, label, tone) {
        const button = flightElement('button', `w-8 h-8 flex items-center justify-center text-slate-400 ${tone} rounded-lg transition-colors`);
        button.type = 'button';
        button.title = label;
        button.setAttribute('aria-label', label);
        const glyph = flightElement('i', `ph ${icon}`);
        glyph.setAttribute('aria-hidden', 'true');
        button.append(glyph);
        return button;
    }

    function flightAllowedLots() {
        const plan = flightDraft.plans.find(item => item.id === $('drone-plan').value);
        const csbId = $('drone-target').value;
        const allowed = new Set((plan?.items || []).filter(item => item.csb_id === csbId).map(item => item.product_id));
        return flightDraft.stocks.filter(item => allowed.has(item.product_id) && BigInt(item.available) > 0n);
    }

    const flightQuantity = item => {
        const value = Number(item.quantity.value);
        return Number.isSafeInteger(value) && value > 0 ? BigInt(value) : 0n;
    };

    // Quantités saisies par lot sur l'ensemble des vols en cours de saisie.
    function flightLotUsage() {
        const usage = new Map();
        for (const parcel of flightParcels) for (const item of parcel.items)
            if (item.select.value) usage.set(item.select.value, (usage.get(item.select.value) || 0n) + flightQuantity(item));
        return usage;
    }

    function updateFlightNeeds() {
        if (!flightDraft) return;
        const usage = flightLotUsage();
        const totals = new Map();
        let lines = 0, total = 0n, overLots = 0;
        flightParcels.forEach((parcel, index) => {
            parcel.badge.textContent = `Vol ${index + 1}`;
            let parcelTotal = 0n;
            for (const item of parcel.items) {
                const lot = flightDraft.stocks.find(stock => stock.id === item.select.value);
                const quantity = flightQuantity(item);
                parcelTotal += quantity;
                if (lot && quantity > 0n) {
                    lines++;
                    totals.set(lot.product_id, (totals.get(lot.product_id) || 0n) + quantity);
                }
                if (!lot) { item.hint.textContent = ''; continue; }
                const left = BigInt(lot.available) - (usage.get(lot.id) || 0n);
                item.hint.textContent = left < 0n
                    ? `Lot dépassé de ${number(-left)} (disponible : ${number(lot.available)})`
                    : `Disponible : ${number(lot.available)} · reste après ces vols : ${number(left)}`;
                item.hint.className = `col-span-3 -mt-1 text-[10px] font-mono ${left < 0n ? 'text-red-600 font-bold' : 'text-slate-400'}`;
            }
            parcel.summary.textContent = `${parcel.items.length} intrant(s) · ${number(parcelTotal)} un.`;
            parcel.empty.hidden = parcel.items.length > 0;
            total += parcelTotal;
        });
        for (const [lotId, used] of usage) {
            const lot = flightDraft.stocks.find(stock => stock.id === lotId);
            if (lot && used > BigInt(lot.available)) overLots++;
        }
        const plan = flightDraft.plans.find(item => item.id === $('drone-plan').value);
        const box = $('drone-active-planning');
        if (plan) renderDeliveryNeeds(box, plan, $('drone-target').value, totals);
        else {
            box.replaceChildren();
            addLine(box, 'Sélectionnez un planning actif pour commencer.');
        }
        $('drone-flights-count').textContent = String(flightParcels.length);
        $('drone-summary').textContent = `${flightParcels.length} vol(s) · ${lines} ligne(s) renseignée(s) · Total : ${number(total)} unité(s)`
            + (overLots ? ` · ⚠ ${overLots} lot(s) au-delà du disponible` : '');
        $('drone-summary').className = `text-[11px] font-semibold ${overLots ? 'text-red-600' : 'text-slate-600'}`;
    }

    function addFlightItem(parcel, {stock = '', quantity = '', focus = true} = {}) {
        const row = flightElement('div', `postgres-flight-item ${FLIGHT_ITEM_GRID} items-center`);
        const select = flightElement('select', 'w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-400');
        select.name = 'stock';
        select.required = true;
        select.setAttribute('aria-label', 'Intrant et lot');
        const lots = flightAllowedLots();
        select.add(new Option(lots.length ? 'Sélectionner un intrant et un lot…' : 'Aucun lot disponible pour ce CSB', ''));
        for (const lot of lots) select.add(new Option(`${lot.name} · Lot ${lot.lot}${lot.expiry_date ? ` · exp. ${lot.expiry_date}` : ''} · Dispo : ${number(lot.available)}`, lot.id));
        // Par défaut, le premier lot pas encore utilisé dans ce colis (évite les doublons).
        const used = new Set(parcel.items.map(item => item.select.value));
        select.value = stock || lots.find(lot => !used.has(lot.id))?.id || '';
        const input = flightElement('input', 'w-full text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white font-mono text-right focus:outline-none focus:border-amber-400');
        Object.assign(input, {name: 'quantity', type: 'number', min: '1', max: '9007199254740991', step: '1', required: true, placeholder: 'Qté'});
        input.setAttribute('aria-label', 'Quantité');
        if (quantity) input.value = String(quantity);
        const remove = flightIconButton('ph-x', 'Retirer cet intrant', 'hover:text-red-600 hover:bg-red-50');
        const hint = flightElement('p', 'col-span-3 -mt-1 text-[10px] font-mono text-slate-400');
        row.append(select, input, remove, hint);
        const item = {row, select, quantity: input, hint};
        select.addEventListener('change', updateFlightNeeds);
        input.addEventListener('input', updateFlightNeeds);
        // Entrée : intrant suivant du colis, ou nouvelle ligne si la ligne courante est remplie.
        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const next = parcel.items[parcel.items.indexOf(item) + 1];
            if (next) next.select.focus?.();
            else if (select.value && flightQuantity(item) > 0n) addFlightItem(parcel);
        });
        remove.addEventListener('click', () => {
            parcel.items = parcel.items.filter(entry => entry !== item);
            parcel.list.replaceChildren(...parcel.items.map(entry => entry.row));
            updateFlightNeeds();
        });
        parcel.items.push(item);
        parcel.list.append(row);
        updateFlightNeeds();
        if (focus) (select.value ? input : select).focus?.();
        return item;
    }

    function addFlightParcel({items = null, after = null} = {}) {
        if (!flightDraft) return null;
        const card = flightElement('div', 'postgres-flight-parcel bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm');
        card.dataset.id = crypto.randomUUID();
        const header = flightElement('div', 'flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200');
        const title = flightElement('div', 'flex items-center gap-2 min-w-0');
        const badge = flightElement('span', 'px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-extrabold');
        const summary = flightElement('span', 'text-[11px] font-semibold text-slate-600');
        title.append(badge, summary, flightElement('span', 'hidden sm:inline text-[10px] text-slate-400', 'BL généré à l’enregistrement'));
        const actions = flightElement('div', 'flex items-center gap-1');
        const duplicate = flightIconButton('ph-copy', 'Dupliquer ce vol (mêmes lots et quantités)', 'hover:text-sky-700 hover:bg-sky-50');
        const remove = flightIconButton('ph-trash', 'Retirer ce vol', 'hover:text-red-600 hover:bg-red-50');
        actions.append(duplicate, remove);
        header.append(title, actions);
        const body = flightElement('div', 'p-3 space-y-2');
        const head = flightElement('div', `${FLIGHT_ITEM_GRID} px-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400`);
        head.append(flightElement('span', '', 'Intrant et lot'), flightElement('span', 'text-right', 'Quantité'), flightElement('span'));
        const list = flightElement('div', 'postgres-flight-items space-y-2');
        const empty = flightElement('p', 'text-[11px] text-slate-500 italic', 'Colis vide : ajoutez un intrant ou retirez ce vol.');
        const add = flightElement('button', 'text-[11px] font-bold text-cyan-700 hover:underline', '+ Ajouter un intrant');
        add.type = 'button';
        body.append(head, list, empty, add);
        card.append(header, body);
        const parcel = {id: card.dataset.id, card, badge, summary, list, empty, items: []};
        add.addEventListener('click', () => addFlightItem(parcel));
        duplicate.addEventListener('click', () => addFlightParcel({after: parcel,
            items: parcel.items.map(item => ({stock: item.select.value, quantity: item.quantity.value}))}));
        remove.addEventListener('click', () => {
            const filled = parcel.items.some(item => flightQuantity(item) > 0n);
            if (filled && !confirm('Retirer ce vol et son colis ?')) return;
            flightParcels = flightParcels.filter(entry => entry !== parcel);
            $('drone-flights-container').replaceChildren(...flightParcels.map(entry => entry.card));
            updateFlightNeeds();
        });
        const index = after ? flightParcels.indexOf(after) + 1 : flightParcels.length;
        flightParcels.splice(index, 0, parcel);
        if (after) $('drone-flights-container').replaceChildren(...flightParcels.map(entry => entry.card));
        else $('drone-flights-container').append(card);
        if (items?.length) items.forEach(item => addFlightItem(parcel, {...item, focus: false}));
        else addFlightItem(parcel, {focus: false});
        updateFlightNeeds();
        card.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
        return parcel;
    }

    function resetFlightParcels() {
        flightParcels = [];
        $('drone-flights-container').replaceChildren();
    }

    function setFlightTarget() {
        const plan = flightDraft.plans.find(item => item.id === $('drone-plan').value);
        const targets = new Map((plan?.items || []).map(item => [item.csb_id, item.csb_name]));
        $('drone-target').replaceChildren();
        for (const [id, name] of targets) $('drone-target').add(new Option(name, id));
        $('drone-target').disabled = !targets.size;
        showPlanningValidationWarning('drone-validation-warning', plan);
        flightDraft.plan = $('drone-plan').value;
        flightDraft.target = $('drone-target').value;
        resetFlightParcels();
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
        resetFlightParcels();
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
        // Contrôle préalable : un même lot ne peut pas être réservé au-delà de son disponible sur l'ensemble des vols.
        const reserved = new Map();
        for (const flight of flights) for (const item of flight.items)
            reserved.set(item.stock_id, (reserved.get(item.stock_id) || 0n) + BigInt(item.quantity));
        const overLot = [...reserved].map(([id, quantity]) => [draft.stocks.find(stock => stock.id === id), quantity])
            .find(([lot, quantity]) => lot && quantity > BigInt(lot.available));
        if (overLot) {
            $('postgres-drone-form-status').textContent = `Lot ${overLot[0].lot} (${overLot[0].name}) : ${number(overLot[1])} demandé(s) pour ${number(overLot[0].available)} disponible(s). Réduisez les quantités ou choisissez un autre lot.`;
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
        showPlanningValidationWarning('sortie-validation-warning', plan);
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

    // ---------- Statistiques de livraison (écran Statistiques) et sorties d'avant Q.box (écran Historique) — style : delivery-stats.css ----------
    // Données : qbox_delivery_statistics (vols et expéditions clôturés + sorties historiques importées) et
    // qbox_legacy_deliveries (registre des sorties d'avant Q.box, hors stock, par BL).
    // Couleurs des origines : 3 premières teintes de la palette catégorielle validée (daltonisme), fixes par origine.
    const DS_SOURCES = [
        { key: 'drone', label: 'Vols drone', icon: 'ph-drone' },
        { key: 'road', label: 'Expéditions terrestres', icon: 'ph-truck' },
        { key: 'legacy', label: 'Avant Q.box (Excel)', icon: 'ph-file-xls' }
    ];
    const DS_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const DS_MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const LEGACY_PAGE_SIZE = 50;
    let deliveryStatsSequence = 0;
    let deliveryStatsSource = 'all';
    let deliveryStatsState = null;
    let legacySequence = 0;
    let legacyState = null;
    let legacyProductsLoaded = false;

    function dsElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== '') element.textContent = text;
        return element;
    }

    function dsIcon(name) {
        const icon = dsElement('i', `ph ${name}`);
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function dsNumber(value) {
        try { return BigInt(value ?? 0).toLocaleString('fr-FR'); } catch { return String(value ?? '—'); }
    }

    function dsPercent(part, total) {
        const value = total > 0 ? Number(part) * 100 / total : 0;
        if (value > 0 && value < 0.1) return '< 0,1 %';
        return `${value.toLocaleString('fr-FR', { maximumFractionDigits: value >= 10 ? 0 : 1 })} %`;
    }

    function dsDate(iso) {
        if (!iso) return '—';
        const [year, month, day] = String(iso).slice(0, 10).split('-');
        return `${day}/${month}/${year}`;
    }

    function dsMonth(month, long = false) {
        const [year, index] = String(month).split('-').map(Number);
        return long ? `${DS_MONTHS_LONG[index - 1]} ${year}` : DS_MONTHS[index - 1];
    }

    // Nom court d'un intrant pour les étiquettes serrées (nom complet en infobulle).
    function dsShortName(name) {
        const text = String(name || '').replace(/\s+/g, ' ').trim();
        return text.length > 30 ? `${text.slice(0, 28).trim()}…` : text;
    }

    function dsPeriod(value) {
        const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date());
        const [year, month, day] = today.split('-').map(Number);
        const back = months => new Date(Date.UTC(year, month - 1 - months, day + 1)).toISOString().slice(0, 10);
        if (value === '12m') return { from: back(12), to: today, label: '12 derniers mois' };
        if (value === '3m') return { from: back(3), to: today, label: '3 derniers mois' };
        if (value === 'year') return { from: `${year}-01-01`, to: today, label: `Année ${year}` };
        if (value === 'custom') {
            // Bornes incluses ; une borne vide laisse la période ouverte de ce côté.
            const from = $('delivery-stats-from').value || null, to = $('delivery-stats-to').value || null;
            if (from && to && from > to) return { from, to, error: 'La date de début doit précéder la date de fin.' };
            const label = from && to ? `Du ${dsDate(from)} au ${dsDate(to)}`
                : from ? `Depuis le ${dsDate(from)}` : to ? `Jusqu’au ${dsDate(to)}` : 'Tout l’historique';
            return { from, to, label };
        }
        return { from: null, to: null, label: 'Tout l’historique' };
    }

    // Période choisie en haut de l'écran Statistiques : statistiques de livraison et CAP livrés.
    function statsPeriod() {
        return dsPeriod($('delivery-stats-period').value);
    }

    // ---------- Registre des livraisons clôturées (écran Historique) : période, district et résumé ----------
    // Raccourcis de période : ils remplissent les dates Du/Au, qui restent modifiables (une saisie passe en
    // « Personnalisée »). « Planning actif » = dates du planning en cours du site (renvoyé par qbox_list_closed_flights).
    const HISTORY_CLOSED_PRESETS = ['all', 'week', 'month', 'year', 'planning', 'custom'];
    const HISTORY_CLOSED_PRESET_LABELS = { week: 'Semaine en cours', month: 'Mois en cours', year: 'Année en cours' };
    let historyClosedPreset = 'all';
    let historyClosedPlanning = null;

    function historyClosedPeriod() {
        const from = $('history-closed-from').value || null, to = $('history-closed-to').value || null;
        if (from && to && from > to) return { from, to, error: 'La date de début doit précéder la date de fin.' };
        const range = from && to ? `Du ${dsDate(from)} au ${dsDate(to)}`
            : from ? `Depuis le ${dsDate(from)}` : to ? `Jusqu’au ${dsDate(to)}` : 'Tout l’historique';
        const name = historyClosedPreset === 'planning' && historyClosedPlanning ? `Planning ${historyClosedPlanning.code}`
            : HISTORY_CLOSED_PRESET_LABELS[historyClosedPreset];
        return { from, to, label: name && (from || to) ? `${name} (${range.charAt(0).toLowerCase()}${range.slice(1)})` : range };
    }

    function historyClosedPresetRange(preset) {
        const today = dsToday();
        const [year, month, day] = today.split('-').map(Number);
        if (preset === 'week') {
            // Semaine du lundi au jour même.
            const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
            return { from: new Date(Date.UTC(year, month - 1, day - ((weekday + 6) % 7))).toISOString().slice(0, 10), to: today };
        }
        if (preset === 'month') return { from: `${today.slice(0, 8)}01`, to: today };
        if (preset === 'year') return { from: `${year}-01-01`, to: today };
        if (preset === 'planning' && historyClosedPlanning) return { from: historyClosedPlanning.start_date, to: historyClosedPlanning.end_date };
        return { from: '', to: '' };
    }

    function dsToday() {
        return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date());
    }

    function markHistoryClosedPreset(preset) {
        historyClosedPreset = preset;
        for (const key of HISTORY_CLOSED_PRESETS) $(`history-closed-preset-${key}`).setAttribute('aria-pressed', String(key === preset));
    }

    function syncHistoryClosedBounds() {
        $('history-closed-to').min = $('history-closed-from').value || '';
        $('history-closed-from').max = $('history-closed-to').value || '';
    }

    function selectHistoryClosedPreset(preset) {
        if (preset === 'planning' && !historyClosedPlanning) return;
        markHistoryClosedPreset(preset);
        if (preset === 'custom') {
            // Personnalisée : garde les dates affichées et place le curseur sur « Du ».
            $('history-closed-from').focus?.();
            return;
        }
        const range = historyClosedPresetRange(preset);
        $('history-closed-from').value = range.from;
        $('history-closed-to').value = range.to;
        syncHistoryClosedBounds();
        refreshDeliveries('history', { keepLegacy: true });
    }

    // Saisie manuelle des dates : période personnalisée (ou « Tout » si les deux dates sont vides).
    function changeHistoryClosedPeriod() {
        const empty = !$('history-closed-from').value && !$('history-closed-to').value;
        markHistoryClosedPreset(empty ? 'all' : 'custom');
        syncHistoryClosedBounds();
        refreshDeliveries('history', { keepLegacy: true });
    }

    function changeHistoryClosedDistrict() {
        refreshDeliveries('history', { keepLegacy: true });
    }

    function resetHistoryClosedDistrict() {
        $('history-closed-district').value = '';
    }

    function clearHistoryClosedPeriod() {
        $('history-closed-from').value = '';
        $('history-closed-to').value = '';
        resetHistoryClosedDistrict();
        changeHistoryClosedPeriod();
    }

    // Districts du site et planning en cours, renvoyés avec la première page.
    function applyHistoryClosedMeta(data) {
        const select = $('history-closed-district');
        const current = select.value;
        const options = [dsOption('', 'Tous les districts')];
        for (const item of data.districts || []) options.push(dsOption(item.district, `${item.district} (${item.flights})`));
        if (current && !(data.districts || []).some(item => item.district === current)) options.push(dsOption(current, current));
        select.replaceChildren(...options);
        select.value = current;
        historyClosedPlanning = data.active_planning || null;
        const button = $('history-closed-preset-planning');
        button.disabled = !historyClosedPlanning;
        button.title = historyClosedPlanning
            ? `${historyClosedPlanning.code} : du ${dsDate(historyClosedPlanning.start_date)} au ${dsDate(historyClosedPlanning.end_date)}`
            : 'Aucun planning en cours sur ce site';
    }

    function dsOption(value, label) {
        const option = dsElement('option', '', label);
        option.value = value;
        return option;
    }

    // Résumé de la sélection : vols, unités larguées, CSB et districts, intrants les plus largués.
    function renderHistoryClosedSummary(summary) {
        const container = $('history-closed-summary');
        if (!summary || !Number(summary.flights || 0) && !Number(summary.cancelled || 0)) { container.replaceChildren(); return; }
        const tile = (icon, tone, label, value, hint) => {
            const card = dsElement('div', `hc-tile hc-tone-${tone}`);
            const head = dsElement('span', 'hc-tile-label');
            head.append(dsIcon(icon), dsElement('span', '', label));
            card.append(head, dsElement('strong', '', value), dsElement('span', 'hc-tile-hint', hint));
            return card;
        };
        const cancelled = Number(summary.cancelled || 0);
        const span = summary.first_day ? (summary.first_day === summary.last_day ? `le ${dsDate(summary.first_day)}`
            : `du ${dsDate(summary.first_day)} au ${dsDate(summary.last_day)}`) : '';
        const tiles = dsElement('div', 'hc-tiles');
        tiles.append(
            tile('ph-drone', 'blue', 'Vols clôturés', dsNumber(summary.flights), cancelled ? `+ ${dsNumber(cancelled)} annulé(s) · ${span}` : span),
            tile('ph-package', 'green', 'Unités larguées', dsNumber(summary.units), `${dsNumber(summary.products)} intrant(s) différent(s)`),
            tile('ph-first-aid-kit', 'violet', 'CSB livrés', dsNumber(summary.csbs), `${dsNumber(summary.districts)} district(s)`));
        const top = summary.top || [];
        const parts = [tiles];
        if (top.length) {
            const box = dsElement('div', 'hc-top');
            box.append(dsElement('p', 'hc-top-title', 'Intrants les plus largués'));
            const list = dsElement('ol', 'hc-top-list');
            const max = Math.max(...top.map(item => Number(item.quantity) || 0), 1);
            for (const item of top) {
                const li = dsElement('li');
                li.title = `${item.name} : ${dsNumber(item.quantity)}${item.unit ? ` ${item.unit}` : ''} en ${dsNumber(item.flights)} vol(s)`;
                const bar = dsElement('span', 'hc-top-bar');
                const fill = dsElement('i');
                fill.style.width = `${Math.max(3, Number(item.quantity) * 100 / max)}%`;
                bar.append(fill);
                const value = dsElement('b', '', dsNumber(item.quantity));
                if (item.unit) value.append(dsElement('small', '', item.unit));
                li.append(dsElement('span', 'hc-top-name', item.name), bar, value);
                list.append(li);
            }
            box.append(list);
            parts.push(box);
        }
        container.replaceChildren(...parts);
    }

    // Blocs dépliables de l'écran Historique (registre des clôtures, sorties d'avant Q.box) : repliés à chaque
    // ouverture de l'écran (selectView) ; leurs données sont chargées quand même (compteur dans l'en-tête).
    const HISTORY_COLLAPSIBLES = ['history-closed', 'legacy-deliveries'];

    function setHistoryBlockOpen(id, open) {
        $(`${id}-panel`).hidden = !open;
        $(`${id}-toggle`).setAttribute('aria-expanded', String(open));
        $(`${id}-toggle`).classList.toggle('is-open', open);
    }

    function collapseHistoryBlocks() {
        for (const id of HISTORY_COLLAPSIBLES) setHistoryBlockOpen(id, false);
    }

    function toggleHistoryBlock(id) {
        setHistoryBlockOpen(id, Boolean($(`${id}-panel`).hidden));
    }

    // Changement de période des statistiques : affiche les dates si « personnalisée », puis relit statistiques et CAP.
    function changeStatsPeriod() {
        const custom = $('delivery-stats-period').value === 'custom';
        $('delivery-stats-range').hidden = !custom;
        const from = $('delivery-stats-from'), to = $('delivery-stats-to');
        const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date());
        to.max = today;
        from.max = to.value || today;
        to.min = from.value || '';
        if (custom && !from.value && !to.value) {
            // Aucune date choisie : propose le mois en cours, modifiable.
            from.value = `${today.slice(0, 8)}01`;
            to.value = today;
            from.max = today;
            to.min = from.value;
        }
        refreshDeliveryStats();
    }

    function dsReducedMotion() {
        return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    }

    // Compteur animé du grand total (valeur finale exacte, BigInt, à la fin).
    function dsCountUp(element, target) {
        const final = dsNumber(target), value = Number(target);
        const token = String(Math.random());
        element.dataset.count = token;
        if (dsReducedMotion() || typeof window.requestAnimationFrame !== 'function' || typeof performance === 'undefined' || !(value > 0)) {
            element.textContent = final;
            return;
        }
        const start = performance.now(), duration = 1200;
        const step = now => {
            if (element.dataset.count !== token) return;
            const t = Math.min(1, (now - start) / duration);
            element.textContent = t < 1 ? Math.round(value * (1 - Math.pow(1 - t, 3))).toLocaleString('fr-FR') : final;
            if (t < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function dsLater(callback) {
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
        else callback();
    }

    function setDeliveryStatsSource(source) {
        deliveryStatsSource = source;
        for (const key of ['all', 'app', 'legacy']) $(`delivery-stats-source-${key}`).setAttribute('aria-pressed', String(key === source));
        refreshDeliveryStats();
    }

    function clearDeliveryStats() {
        for (const id of ['delivery-stats-kpis', 'delivery-stats-mix', 'delivery-stats-legend', 'delivery-stats-months',
            'delivery-stats-products', 'delivery-stats-districts', 'delivery-stats-matrix']) $(id).replaceChildren();
        $('delivery-stats-total').dataset.count = '';
        $('delivery-stats-total').textContent = '—';
        $('delivery-stats-total-hint').textContent = 'unités, tous intrants confondus';
        $('delivery-stats-export').disabled = true;
        $('delivery-stats-print').disabled = true;
        deliveryStatsState = null;
    }

    // Portée de tout l'écran Statistiques : site sélectionné, ou tous les sites (admin, logistique, UNFPA).
    const STATS_ALL_SITES_ROLES = ['admin', 'logistics', 'unfpa'];

    function statsScopeAll() {
        return hasRole(STATS_ALL_SITES_ROLES) && $('stats-scope').value === 'all';
    }

    function statsScopeLabel(all = statsScopeAll()) {
        return all ? 'Tous les sites' : (portSelect.selectedOptions?.[0]?.textContent || 'Site sélectionné');
    }

    const DS_SOURCE_LABELS = { all: 'toutes origines', app: 'livraisons Q.box', legacy: 'sorties avant Q.box' };

    async function refreshDeliveryStats() {
        const port = portSelect.value, sequence = ++deliveryStatsSequence, requestGeneration = sessionGeneration;
        const status = $('delivery-stats-status');
        $('stats-scope-wrap').hidden = !hasRole(STATS_ALL_SITES_ROLES);
        clearDeliveryStats();
        // Même portée, période et origine pour l'estimation des CAP livrés (05-couples-annee-protection.js).
        refreshCyp();
        const all = statsScopeAll();
        $('delivery-stats-heading').textContent = all ? 'Ce que le réseau a livré' : 'Ce que le drone port a livré';
        if (!port && !all) { status.textContent = 'Aucun site disponible.'; return; }
        const period = statsPeriod();
        if (period.error) { status.textContent = period.error; return; }
        status.textContent = 'Calcul des statistiques…';
        try {
            const data = await api('/rest/v1/rpc/qbox_delivery_statistics', {
                selected_port: all ? null : port, from_date: period.from, to_date: period.to, source_filter: deliveryStatsSource
            }, true);
            if (sequence !== deliveryStatsSequence || activeView !== 'statistics' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            deliveryStatsState = { data, period, scope: statsScopeLabel(all), source: DS_SOURCE_LABELS[deliveryStatsSource] || DS_SOURCE_LABELS.all };
            renderDeliveryStats(data);
            status.textContent = `${period.label} · ${deliveryStatsState.scope} · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === deliveryStatsSequence && activeView === 'statistics' && sessionGeneration === requestGeneration)
                status.textContent = `Statistiques indisponibles : ${error.message}`;
        }
    }

    function renderDeliveryStats(data) {
        const totals = data.totals || {};
        const total = Number(totals.quantity || 0);
        dsCountUp($('delivery-stats-total'), totals.quantity || '0');
        $('delivery-stats-total-hint').textContent = totals.first_date
            ? `unités, tous intrants confondus · du ${dsDate(totals.first_date)} au ${dsDate(totals.last_date)}`
            : 'aucune livraison sur cette période';
        renderDeliveryStatsKpis(data, total);
        renderDeliveryStatsMix(data, total);
        renderDeliveryStatsMonths(data);
        renderDeliveryStatsProducts(data, total);
        renderDeliveryStatsDistricts(data, total);
        renderDeliveryStatsMatrix(data);
        $('delivery-stats-export').disabled = !(data.products || []).length;
        $('delivery-stats-print').disabled = !(data.products || []).length;
    }

    function renderDeliveryStatsKpis(data, total) {
        const totals = data.totals || {};
        const deliveries = Number(totals.deliveries || 0);
        const months = (data.months || []).length;
        const best = (data.months || []).reduce((top, month) => !top || Number(month.quantity) > Number(top.quantity) ? month : top, null);
        const kpis = $('delivery-stats-kpis');
        for (const [label, icon, value, hint] of [
            ['Livraisons (BL)', 'ph-package', dsNumber(deliveries), `${dsNumber(totals.lines || 0)} lignes d’intrants`],
            ['Destinataires servis', 'ph-users-three', dsNumber(totals.destinations || 0), `${totals.districts || 0} district(s)`],
            ['Intrants différents', 'ph-first-aid-kit', dsNumber(totals.products || 0), 'références livrées'],
            ['Moyenne par livraison', 'ph-stack', deliveries ? Math.round(total / deliveries).toLocaleString('fr-FR') : '—', 'unités par BL'],
            ['Mois record', 'ph-trophy', best ? dsMonth(best.month, true) : '—',
                best ? `${dsNumber(best.quantity)} unités · ${months} mois actifs` : 'aucun mois']
        ]) {
            const tile = dsElement('div', 'ds-kpi');
            const head = dsElement('span', 'ds-kpi-label');
            head.append(dsIcon(icon), dsElement('span', '', label));
            tile.append(head, dsElement('span', 'ds-kpi-value', value), dsElement('span', 'ds-kpi-hint', hint));
            kpis.append(tile);
        }
    }

    function dsSourceTotals(data) {
        const map = new Map((data.sources || []).map(source => [source.source, source]));
        return DS_SOURCES.map(source => ({ ...source, quantity: Number(map.get(source.key)?.quantity || 0),
            deliveries: Number(map.get(source.key)?.deliveries || 0) })).filter(source => source.quantity > 0);
    }

    // Répartition par origine : barre segmentée + légende chiffrée (identité jamais portée par la seule couleur).
    function renderDeliveryStatsMix(data, total) {
        const sources = dsSourceTotals(data);
        const mix = $('delivery-stats-mix'), legend = $('delivery-stats-legend');
        if (!sources.length) return;
        const bar = dsElement('div', 'ds-mix-bar');
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', sources.map(source => `${source.label} : ${dsPercent(source.quantity, total)}`).join(', '));
        const keys = dsElement('ul', 'ds-mix-keys');
        for (const source of sources) {
            const segment = dsElement('span', `ds-seg ds-src-${source.key}`);
            segment.style.flexGrow = String(source.quantity);
            segment.title = `${source.label} : ${dsNumber(source.quantity)} unités (${dsPercent(source.quantity, total)})`;
            bar.append(segment);
            const key = dsElement('li', `ds-key ds-src-${source.key}`);
            const text = dsElement('span');
            text.append(dsElement('b', '', source.label),
                dsElement('span', '', `${dsNumber(source.quantity)} unités · ${dsNumber(source.deliveries)} BL · ${dsPercent(source.quantity, total)}`));
            key.append(dsIcon(source.icon), text);
            keys.append(key);
            const chip = dsElement('span', `ds-legend-item ds-src-${source.key}`);
            chip.append(dsElement('i', 'ds-swatch'), dsElement('span', '', source.label));
            legend.append(chip);
        }
        mix.append(bar, keys);
    }

    function dsNiceMax(value) {
        if (!(value > 0)) return 1;
        const power = Math.pow(10, Math.floor(Math.log10(value)));
        const step = [1, 2, 2.5, 5, 10].find(factor => factor * power >= value) || 10;
        return step * power;
    }

    // Mois consécutifs du premier au dernier : un mois sans livraison reste visible (colonne vide), l'axe du temps n'est pas compressé.
    function dsContinuousMonths(months) {
        if (!months.length) return [];
        const byMonth = new Map(months.map(month => [month.month, month]));
        const [firstYear, firstMonth] = months[0].month.split('-').map(Number);
        const [lastYear, lastMonth] = months[months.length - 1].month.split('-').map(Number);
        const result = [];
        for (let year = firstYear, month = firstMonth; year < lastYear || (year === lastYear && month <= lastMonth);) {
            const key = `${year}-${String(month).padStart(2, '0')}`;
            result.push(byMonth.get(key) || { month: key, quantity: '0', deliveries: 0, drone: '0', road: '0', legacy: '0' });
            if (++month > 12) { month = 1; year++; }
        }
        return result;
    }

    // Colonnes empilées par mois (ordre fixe des origines), grille légère, infobulle au survol et au clavier.
    function renderDeliveryStatsMonths(data) {
        const container = $('delivery-stats-months');
        const months = dsContinuousMonths(data.months || []);
        if (!months.length) { container.append(dsElement('p', 'ds-empty', 'Aucune livraison sur cette période.')); return; }
        const max = dsNiceMax(Math.max(...months.map(month => Number(month.quantity))));
        const record = months.reduce((top, month) => Number(month.quantity) > Number(top.quantity) ? month : top, months[0]);
        const chart = dsElement('div', 'ds-chart');
        const axis = dsElement('div', 'ds-axis');
        axis.setAttribute('aria-hidden', 'true');
        for (const fraction of [1, 0.5, 0]) {
            const tick = dsElement('span', 'ds-tick', Math.round(max * fraction).toLocaleString('fr-FR'));
            tick.style.bottom = `${fraction * 100}%`;
            axis.append(tick);
        }
        const plot = dsElement('div', 'ds-plot');
        plot.style.setProperty?.('--n', String(months.length));
        const tip = dsElement('div', 'ds-tip');
        tip.hidden = true;
        const show = (column, month) => {
            tip.replaceChildren(dsElement('strong', '', dsMonth(month.month, true)),
                dsElement('span', 'ds-tip-total', `${dsNumber(month.quantity)} unités · ${dsNumber(month.deliveries)} BL`));
            for (const source of DS_SOURCES) {
                if (!Number(month[source.key])) continue;
                const line = dsElement('span', `ds-tip-line ds-src-${source.key}`);
                line.append(dsElement('i', 'ds-swatch'), dsElement('span', '', source.label), dsElement('b', '', dsNumber(month[source.key])));
                tip.append(line);
            }
            tip.hidden = false;
            const left = (column.offsetLeft || 0) + (column.offsetWidth || 0) / 2;
            const width = plot.scrollWidth || plot.clientWidth || 0;
            tip.style.left = `${Math.max(90, Math.min(width - 90, left))}px`;
        };
        for (const [index, month] of months.entries()) {
            const column = dsElement('div', 'ds-col');
            column.tabIndex = 0;
            column.style.setProperty?.('--i', String(index));
            column.setAttribute('aria-label', `${dsMonth(month.month, true)} : ${dsNumber(month.quantity)} unités, ${dsNumber(month.deliveries)} livraisons`);
            if (month === record) column.classList.add('ds-record');
            const stack = dsElement('div', 'ds-stack');
            const height = Number(month.quantity) * 100 / max;
            stack.style.height = '0%';
            dsLater(() => { stack.style.height = `${height}%`; });
            for (const source of DS_SOURCES) {
                const value = Number(month[source.key] || 0);
                if (!value) continue;
                const part = dsElement('span', `ds-part ds-src-${source.key}`);
                part.style.flexGrow = String(value);
                stack.append(part);
            }
            if (month === record) stack.append(dsElement('em', 'ds-record-flag', 'Record'));
            const [year, number] = month.month.split('-');
            const label = dsElement('span', 'ds-col-label', dsMonth(month.month));
            if (index === 0 || number === '01') label.append(dsElement('b', '', year));
            column.append(stack, label);
            column.addEventListener('mouseenter', () => show(column, month));
            column.addEventListener('focus', () => show(column, month));
            column.addEventListener('mouseleave', () => { tip.hidden = true; });
            column.addEventListener('blur', () => { tip.hidden = true; });
            plot.append(column);
        }
        plot.append(tip);
        chart.append(axis, plot);
        container.append(chart);
    }

    // Classement des intrants : barre proportionnelle au plus livré, segmentée par origine.
    function renderDeliveryStatsProducts(data, total) {
        const list = $('delivery-stats-products');
        const products = data.products || [];
        if (!products.length) { list.append(dsElement('li', 'ds-empty', 'Aucun intrant livré sur cette période.')); return; }
        const max = Number(products[0].quantity) || 1;
        for (const [index, product] of products.entries()) {
            const item = dsElement('li', 'ds-product');
            item.style.setProperty?.('--i', String(index));
            const rank = dsElement('span', `ds-rank${index < 3 ? ' ds-rank-top' : ''}`, String(index + 1));
            const body = dsElement('div', 'ds-product-body');
            const head = dsElement('div', 'ds-product-head');
            const name = dsElement('span', 'ds-product-name', product.name);
            name.title = product.name;
            const figure = dsElement('span', 'ds-product-figure');
            figure.append(dsElement('b', '', dsNumber(product.quantity)), dsElement('span', '', dsPercent(product.quantity, total)));
            head.append(name, figure);
            const track = dsElement('div', 'ds-track');
            const fill = dsElement('div', 'ds-fill');
            fill.style.width = '0%';
            dsLater(() => { fill.style.width = `${Math.max(1.5, Number(product.quantity) * 100 / max)}%`; });
            for (const source of DS_SOURCES) {
                const value = Number(product[source.key] || 0);
                if (!value) continue;
                const part = dsElement('span', `ds-part ds-src-${source.key}`);
                part.style.flexGrow = String(value);
                part.title = `${source.label} : ${dsNumber(value)}`;
                fill.append(part);
            }
            track.append(fill);
            const meta = dsElement('span', 'ds-product-meta',
                `${product.unit || 'Unité'} · ${dsNumber(product.deliveries)} livraison(s) · ${dsNumber(product.destinations)} destinataire(s)`);
            body.append(head, track, meta);
            item.append(rank, body);
            list.append(item);
        }
    }

    function renderDeliveryStatsDistricts(data, total) {
        const container = $('delivery-stats-districts');
        const districts = data.districts || [];
        if (!districts.length) { container.append(dsElement('p', 'ds-empty', 'Aucun district livré sur cette période.')); return; }
        const names = new Map((data.products || []).map(product => [product.product_id, product.name]));
        for (const [index, district] of districts.entries()) {
            const card = dsElement('article', 'ds-district');
            card.style.setProperty?.('--i', String(index));
            const share = total > 0 ? Number(district.quantity) * 100 / total : 0;
            const head = dsElement('div', 'ds-district-head');
            const ring = dsElement('span', 'ds-ring');
            ring.setAttribute('role', 'img');
            ring.setAttribute('aria-label', `${dsPercent(district.quantity, total)} du grand total`);
            ring.dataset.label = dsPercent(district.quantity, total);
            ring.style.setProperty?.('--p', '0');
            dsLater(() => ring.style.setProperty?.('--p', String(share)));
            const title = dsElement('div', 'ds-district-title');
            title.append(dsElement('strong', '', district.district),
                dsElement('span', '', `${dsNumber(district.deliveries)} BL · ${dsNumber(district.destinations)} destinataire(s)`));
            head.append(ring, title);
            const figure = dsElement('div', 'ds-district-figure');
            figure.append(dsElement('b', '', dsNumber(district.quantity)), dsElement('span', '', 'unités livrées'));
            const top = dsElement('ol', 'ds-top');
            const best = Number(district.top?.[0]?.quantity || 0) || 1;
            for (const csb of district.top || []) {
                const row = dsElement('li');
                const label = dsElement('span', 'ds-top-name', csb.name);
                const bar = dsElement('span', 'ds-top-bar');
                const fill = dsElement('i');
                fill.style.width = `${Number(csb.quantity) * 100 / best}%`;
                bar.append(fill);
                row.append(label, bar, dsElement('b', '', dsNumber(csb.quantity)));
                top.append(row);
            }
            const chips = dsElement('div', 'ds-chips');
            for (const product of (district.products || []).slice(0, 3)) {
                const chip = dsElement('span', 'ds-chip', dsShortName(names.get(product.product_id)));
                chip.title = `${names.get(product.product_id) || ''} : ${dsNumber(product.quantity)}`;
                chips.append(chip);
            }
            card.append(head, figure, dsElement('span', 'ds-subtitle', 'Principaux destinataires'), top,
                dsElement('span', 'ds-subtitle', 'Intrants les plus livrés'), chips);
            container.append(card);
        }
    }

    // Tableau croisé intrants × districts : vue tabulaire des mêmes données (accessibilité, export CSV).
    function renderDeliveryStatsMatrix(data) {
        const table = $('delivery-stats-matrix');
        const products = data.products || [], districts = data.districts || [];
        if (!products.length) return;
        const cells = new Map();
        let max = 0;
        for (const district of districts) for (const product of district.products || []) {
            const value = Number(product.quantity);
            cells.set(`${product.product_id}|${district.district}`, product.quantity);
            if (value > max) max = value;
        }
        const thead = dsElement('thead'), headRow = dsElement('tr');
        headRow.append(dsElement('th', 'ds-sticky', 'Intrant'));
        for (const district of districts) headRow.append(dsElement('th', 'ds-num', district.district));
        headRow.append(dsElement('th', 'ds-num ds-total-col', 'Total'));
        thead.append(headRow);
        const tbody = dsElement('tbody');
        for (const product of products) {
            const row = dsElement('tr');
            const name = dsElement('th', 'ds-sticky', product.name);
            name.scope = 'row';
            row.append(name);
            for (const district of districts) {
                const value = cells.get(`${product.product_id}|${district.district}`);
                const cell = dsElement('td', 'ds-num ds-heat', value ? dsNumber(value) : '—');
                const level = value && max ? Number(value) / max : 0;
                cell.style.setProperty?.('--a', `${Math.round(Math.sqrt(level) * 70)}%`);
                if (level > 0.45) cell.classList.add('ds-heat-strong');
                if (!value) cell.classList.add('ds-heat-none');
                row.append(cell);
            }
            row.append(dsElement('td', 'ds-num ds-total-col', dsNumber(product.quantity)));
            tbody.append(row);
        }
        const totalRow = dsElement('tr', 'ds-total-row');
        totalRow.append(dsElement('th', 'ds-sticky', 'Total'));
        for (const district of districts) totalRow.append(dsElement('td', 'ds-num', dsNumber(district.quantity)));
        totalRow.append(dsElement('td', 'ds-num ds-total-col ds-grand', dsNumber(data.totals?.quantity || 0)));
        tbody.append(totalRow);
        table.append(thead, tbody);
    }

    // Impression des statistiques de livraison : en-tête UNFPA, synthèse, origines, mois, intrants, districts.
    function openDeliveryStatsPrint() {
        if (!deliveryStatsState) return;
        const { data, period, scope, source } = deliveryStatsState;
        const totals = data.totals || {};
        const total = Number(totals.quantity || 0);
        const report = $('stats-print-content');
        report.replaceChildren(planningPrintHeader('STATISTIQUES DE LIVRAISON', null, { name: scope }, `Période : ${period.label}`));
        report.append(dsElement('h1', '', 'Statistiques de livraison'),
            dsElement('p', '', `${scope} · ${period.label} · ${source}. Vols drone et expéditions terrestres clôturés, et sorties d’avant Q.box (hors stock).`),
            dsElement('p', 'stats-print-total', `Grand total livré : ${dsNumber(totals.quantity)} unités · ${dsNumber(totals.deliveries)} livraison(s) · `
                + `${dsNumber(totals.destinations)} destinataire(s) · ${dsNumber(totals.districts)} district(s)`
                + (totals.first_date ? ` · du ${dsDate(totals.first_date)} au ${dsDate(totals.last_date)}` : '')));
        const table = (title, head, rows, numeric) => {
            report.append(dsElement('h2', '', title));
            const element = dsElement('table');
            const thead = dsElement('thead'), header = dsElement('tr');
            head.forEach((label, index) => header.append(dsElement('th', numeric.includes(index) ? 'ds-num' : '', label)));
            thead.append(header);
            const tbody = dsElement('tbody');
            for (const cells of rows) {
                const tr = dsElement('tr');
                cells.forEach((value, index) => tr.append(dsElement('td', numeric.includes(index) ? 'ds-num' : '', String(value))));
                tbody.append(tr);
            }
            if (!rows.length) {
                const tr = dsElement('tr'), cell = dsElement('td', '', 'Aucune donnée.');
                cell.colSpan = head.length;
                tr.append(cell);
                tbody.append(tr);
            }
            element.append(thead, tbody);
            report.append(element);
        };
        const labels = Object.fromEntries(DS_SOURCES.map(item => [item.key, item.label]));
        table('Par origine', ['Origine', 'Quantité', 'Livraisons', 'Part'],
            (data.sources || []).map(item => [labels[item.source] || item.source, dsNumber(item.quantity), dsNumber(item.deliveries), dsPercent(Number(item.quantity), total)]), [1, 2, 3]);
        table('Par mois', ['Mois', 'Quantité', 'Livraisons', 'Vols drone', 'Expéditions', 'Avant Q.box'],
            (data.months || []).map(item => [dsMonth(item.month, true), dsNumber(item.quantity), dsNumber(item.deliveries),
                dsNumber(item.drone), dsNumber(item.road), dsNumber(item.legacy)]), [1, 2, 3, 4, 5]);
        table('Par intrant', ['Intrant', 'Unité', 'Quantité', 'Livraisons', 'Destinataires', 'Part'],
            (data.products || []).map(item => [item.name, item.unit || '', dsNumber(item.quantity), dsNumber(item.deliveries),
                dsNumber(item.destinations), dsPercent(Number(item.quantity), total)]), [2, 3, 4, 5]);
        table('Par district', ['District', 'Quantité', 'Livraisons', 'Destinataires', 'Part'],
            (data.districts || []).map(item => [item.district, dsNumber(item.quantity), dsNumber(item.deliveries),
                dsNumber(item.destinations), dsPercent(Number(item.quantity), total)]), [1, 2, 3, 4]);
        showStatsPrint('Aperçu · Statistiques de livraison');
    }

    function exportDeliveryStats() {
        downloadTableCsv($('delivery-stats-matrix'), tableCsvFileName('statistiques-livraison', statsScopeLabel()));
    }

    // ---------- Registre des sorties d'avant Q.box ----------
    function legacyFilter() {
        return {
            from: $('legacy-deliveries-from').value || null,
            to: $('legacy-deliveries-to').value || null,
            product: $('legacy-deliveries-product').value || null,
            search: String($('legacy-deliveries-search').value ?? '').trim() || null
        };
    }

    async function loadLegacyProducts() {
        if (legacyProductsLoaded) return;
        try {
            const products = await api('/rest/v1/rpc/qbox_list_products', {}, true);
            const select = $('legacy-deliveries-product');
            for (const product of [...(products || [])].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'))) {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                select.append(option);
            }
            legacyProductsLoaded = true;
        } catch { /* filtre par intrant indisponible : le registre reste consultable */ }
    }

    async function refreshLegacyDeliveries(reset = true) {
        const port = portSelect.value, status = $('legacy-deliveries-status'), body = $('legacy-deliveries-body'), more = $('legacy-deliveries-more');
        if (reset || !legacyState || legacyState.port !== port) {
            legacyState = { port, filter: legacyFilter(), offset: 0 };
            body.replaceChildren();
            $('legacy-deliveries-export').disabled = true;
            $('legacy-deliveries-count').textContent = '';
        }
        more.hidden = true;
        if (!port) { status.textContent = 'Aucun site disponible.'; return; }
        const state = legacyState, sequence = ++legacySequence, requestGeneration = sessionGeneration;
        status.textContent = 'Chargement des sorties d’avant Q.box…';
        loadLegacyProducts();
        try {
            const data = await api('/rest/v1/rpc/qbox_legacy_deliveries', {
                selected_port: port, from_date: state.filter.from, to_date: state.filter.to, product_filter: state.filter.product,
                search_text: state.filter.search, page_limit: LEGACY_PAGE_SIZE, page_offset: state.offset
            }, true);
            if (sequence !== legacySequence || state !== legacyState || activeView !== 'history' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const rows = data.rows || [];
            for (const entry of rows) body.append(legacyRow(entry));
            state.offset += rows.length;
            const filtered = Object.values(state.filter).some(Boolean);
            if (!Number(data.imported)) {
                body.replaceChildren(emptyTableRow('Aucune sortie d’avant Q.box n’a été importée pour ce site.', 6));
                status.textContent = '';
            } else if (!state.offset) {
                body.replaceChildren(emptyTableRow('Aucun BL ne correspond aux filtres.', 6));
                status.textContent = `0 BL sur ${dsNumber(data.imported)} lignes importées.`;
            } else {
                status.textContent = `${dsNumber(state.offset)} BL affiché(s) sur ${dsNumber(data.total)}${filtered ? ' correspondant aux filtres' : ''} · ${dsNumber(data.imported)} lignes importées pour ce site.`;
            }
            more.hidden = state.offset >= Number(data.total || 0);
            $('legacy-deliveries-export').disabled = !state.offset;
            $('legacy-deliveries-count').textContent = Number(data.imported) ? `${dsNumber(data.total)} BL` : '';
        } catch (error) {
            if (sequence === legacySequence && activeView === 'history' && sessionGeneration === requestGeneration)
                status.textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    function legacyRow(entry) {
        const row = dsElement('tr');
        row.append(dsElement('td', 'ds-mono', entry.bl || '—'), dsElement('td', 'ds-nowrap', dsDate(entry.delivered_on)),
            dsElement('td', 'ds-strong', entry.destination), dsElement('td', 'ds-nowrap', entry.district));
        const items = dsElement('td');
        const list = dsElement('ul', 'ds-items');
        for (const item of entry.items || []) {
            const line = dsElement('li');
            line.append(dsElement('span', '', item.product), dsElement('span', 'ds-lot', item.lot ? `lot ${item.lot}` : 'lot non renseigné'),
                dsElement('b', '', dsNumber(item.quantity)));
            line.title = `${item.product} — ${dsNumber(item.quantity)} ${item.unit || ''}${item.expiry_date ? ` — péremption ${dsDate(item.expiry_date)}` : ''}`;
            list.append(line);
        }
        items.append(list);
        row.append(items, dsElement('td', 'ds-num ds-strong', dsNumber(entry.quantity)));
        return row;
    }

    function exportLegacyDeliveries() {
        downloadTableCsv($('legacy-deliveries-table'), tableCsvFileName('sorties-avant-qbox', portSelect.selectedOptions?.[0]?.textContent || ''));
    }

    // ================= Historique global des stocks (#view-stock-history) =================
    // Style : stock-history.css ; courbe : stock-history-chart-style.js.
    // Données : qbox_list_stocks (stock actuel), qbox_stock_at_date (stock au début d'un jour),
    // qbox_stock_history (journal paginé par 100), qbox_list_inventories.

    let stockAtDateState = null;
    let stockAtDateSequence = 0;
    let stockHistoryProduct = '';

    function stockHistoryFilter() {
        return {
            from_date: $('stock-history-from').value || null,
            to_date: $('stock-history-to').value || null,
            operation_filter: $('stock-history-type').value || null,
            search_text: $('stock-history-search').value.trim() || null
        };
    }

    function shToday() {
        return new Intl.DateTimeFormat('fr-CA', {timeZone:'Indian/Antananarivo'}).format(new Date());
    }

    function shDateLabel(value) {
        const [year, month, day] = String(value).split('-');
        return `${day}/${month}/${year}`;
    }

    function shSigned(value) {
        return value > 0n ? `+${number(value)}` : number(value);
    }

    function shLevel(available, threshold) {
        if (available <= 0n) return {key:'out', label:'Rupture'};
        if (threshold === null || threshold <= 0n) return {key:'none', label:'Seuil non défini'};
        if (available < threshold) return {key:'low', label:'Sous le seuil'};
        if (available * 2n <= threshold * 3n) return {key:'watch', label:'À surveiller'};
        return {key:'good', label:'Suffisant'};
    }

    function shSearch() {
        return ($('stock-history-search').value.trim() || '').toLocaleLowerCase('fr');
    }

    // Cellule de tableau : texte ou éléments.
    function shCell(row, content, className = '') {
        const cell = dsElement('td', className);
        if (content && typeof content === 'object') cell.append(...[].concat(content));
        else cell.textContent = content;
        row.append(cell);
        return cell;
    }

    function shDelta(value) {
        if (value === null) return dsElement('span', 'sh-delta sh-delta-unknown', 'Inconnue');
        return dsElement('span', `sh-delta ${value > 0n ? 'sh-delta-up' : value < 0n ? 'sh-delta-down' : 'sh-delta-flat'}`, shSigned(value));
    }

    function appendStockHistoryCells(parent, values) {
        const row = document.createElement('tr');
        for (const value of values) {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.append(cell);
        }
        parent.append(row);
    }

    function clearStockHistoryCharts() {
        for (const chart of stockHistoryCharts) chart.destroy();
        stockHistoryCharts = [];
    }

    function clearStockHistoryView() {
        clearStockHistoryCharts();
        $('stock-history-charts').classList.add('postgres-hidden');
        for (const id of ['stock-history-summary', 'stock-history-movements', 'stock-history-inventories', 'stock-history-kpis', 'stock-history-evolution-stats'])
            $(id).replaceChildren();
        $('stock-history-count').textContent = '';
        $('postgres-stock-history-more').classList.add('hidden');
    }

    // Remise à zéro complète (déconnexion, changement de compte).
    function resetStockHistoryView() {
        stockHistoryState = null;
        stockAtDateState = null;
        stockAtDateSequence++;
        stockHistoryProduct = '';
        clearStockHistoryView();
        $('stock-history-at-date-rows').replaceChildren();
        $('stock-history-at-date-status').textContent = '';
        $('stock-history-at-date-export').disabled = true;
        $('stock-history-status').textContent = '';
        for (const id of ['stock-history-from', 'stock-history-to', 'stock-history-type', 'stock-history-search', 'stock-history-at-date'])
            $(id).value = '';
    }

    // ---------- Indicateurs du bandeau ----------
    function renderStockHistoryKpis() {
        const state = stockHistoryState, kpis = $('stock-history-kpis');
        kpis.replaceChildren();
        const levels = [...state.balances.values()].map(item => shLevel(item.quantity - item.reserved, item.threshold).key);
        let incoming = 0, outgoing = 0;
        for (const entry of state.rows) {
            if (entry.before_stock === null) continue;
            const change = BigInt(entry.after_stock) - BigInt(entry.before_stock);
            if (change > 0n) incoming++; else if (change < 0n) outgoing++;
        }
        const tiles = [
            ['ph-package', 'Intrants suivis', levels.length, `${levels.filter(key => key !== 'out').length} avec du stock disponible`, ''],
            ['ph-warning', 'Sous le seuil', levels.filter(key => key === 'low').length, `${levels.filter(key => key === 'watch').length} à surveiller`, 'sh-kpi-warn'],
            ['ph-prohibit', 'En rupture', levels.filter(key => key === 'out').length, 'Disponible nul', 'sh-kpi-danger'],
            ['ph-arrows-left-right', 'Mouvements chargés', state.count, `${incoming} entrée(s) · ${outgoing} sortie(s)${state.cursor ? ' · liste partielle' : ''}`, 'sh-kpi-info']
        ];
        for (const [icon, label, value, detail, tone] of tiles) {
            const tile = dsElement('div', `sh-kpi ${tone}`);
            const head = dsElement('span', 'sh-kpi-label');
            head.append(dsIcon(icon), dsElement('span', '', label));
            tile.append(head, dsElement('strong', 'sh-kpi-value', number(value)), dsElement('span', 'sh-kpi-detail', detail));
            kpis.append(tile);
        }
    }

    // ---------- Stock actuel (tableau + jauge) ----------
    function renderStockHistorySummary() {
        const body = $('stock-history-summary');
        body.replaceChildren();
        const items = [...stockHistoryState.balances.values()];
        if (!items.length) {
            const row = dsElement('tr', 'sh-empty-row');
            shCell(row, 'Aucun stock pour cet intrant sur ce site.').colSpan = 6;
            body.append(row);
            return;
        }
        let largest = 0n;
        for (const item of items) if (item.quantity - item.reserved > largest) largest = item.quantity - item.reserved;
        for (const item of items) {
            const available = item.quantity - item.reserved;
            const level = shLevel(available, item.threshold);
            const row = dsElement('tr', `sh-row-${level.key}`);
            const name = dsElement('span', 'sh-product');
            name.append(dsElement('strong', '', item.name));
            if (item.unit) name.append(dsElement('small', '', item.unit));
            shCell(row, name);
            shCell(row, dsElement('span', `sh-badge sh-level-${level.key}`, level.label));
            shCell(row, number(item.quantity), 'sh-num');
            shCell(row, number(item.reserved), 'sh-num sh-muted');
            shCell(row, number(available), 'sh-num sh-strong');
            // Échelle : 3 × le seuil (repère au tiers) ; sans seuil, le plus gros disponible du site.
            const hasThreshold = item.threshold !== null && item.threshold > 0n;
            const scale = hasThreshold ? item.threshold * 3n : largest;
            const clamped = available < 0n ? 0n : available > scale ? scale : available;
            const percent = scale > 0n ? Number(clamped * 1000n / scale) / 10 : 0;
            const gauge = dsElement('div', `sh-gauge sh-gauge-${level.key}`);
            gauge.title = hasThreshold ? `Seuil minimal : ${number(item.threshold)}` : 'Seuil non défini';
            const fill = dsElement('span', 'sh-gauge-fill');
            fill.style.width = `${percent}%`;
            gauge.append(fill);
            if (hasThreshold) gauge.append(dsElement('span', 'sh-gauge-mark'));
            const wrap = dsElement('div', 'sh-gauge-cell');
            wrap.append(gauge, dsElement('small', '', hasThreshold ? `seuil ${number(item.threshold)}` : 'sans seuil'));
            shCell(row, wrap, 'sh-gauge-col');
            body.append(row);
        }
    }

    // ---------- Stock à une date ----------
    function renderStockAtDate() {
        const body = $('stock-history-at-date-rows'), status = $('stock-history-at-date-status');
        body.replaceChildren();
        const state = stockAtDateState;
        if (!state) return;
        const search = shSearch();
        const rows = state.rows.filter(item => !search || item.name.toLocaleLowerCase('fr').includes(search));
        let unknown = 0;
        for (const item of rows) {
            const row = document.createElement('tr');
            const name = dsElement('span', 'sh-product');
            name.append(dsElement('strong', '', item.name));
            name.append(dsElement('small', '', [item.category, item.unit].filter(Boolean).join(' · ')));
            shCell(row, name);
            const nowAvailable = BigInt(item.current_stock) - BigInt(item.current_reserved);
            if (item.stock === null) {
                unknown++;
                shCell(row, dsElement('span', 'sh-badge sh-level-none', 'Pas encore suivi')).colSpan = 3;
                shCell(row, number(nowAvailable), 'sh-num sh-strong');
                shCell(row, dsElement('span', 'sh-delta sh-delta-unknown', '—'), 'sh-num');
            } else {
                const thenAvailable = BigInt(item.stock) - BigInt(item.reserved ?? 0);
                const threshold = item.min_threshold == null ? null : BigInt(item.min_threshold);
                shCell(row, number(item.stock), 'sh-num');
                shCell(row, number(item.reserved ?? 0), 'sh-num sh-muted');
                const level = shLevel(thenAvailable, threshold);
                const then = dsElement('span', `sh-avail sh-avail-${level.key}`, number(thenAvailable));
                then.title = level.label;
                shCell(row, then, 'sh-num');
                shCell(row, number(nowAvailable), 'sh-num');
                shCell(row, shDelta(nowAvailable - thenAvailable), 'sh-num');
            }
            body.append(row);
        }
        if (!rows.length) {
            const row = dsElement('tr', 'sh-empty-row');
            shCell(row, 'Aucun intrant à afficher pour cette date.').colSpan = 6;
            body.append(row);
        }
        const label = shDateLabel(state.date);
        status.textContent = `Stock au ${label} à 00 h 00, avant la première opération du jour.` +
            (unknown ? ` ${unknown} intrant(s) n’étaient pas encore suivis dans Q.box à cette date.` : '');
        $('stock-history-at-date-export').disabled = !rows.length;
    }

    async function refreshStockAtDate() {
        const port = portSelect.value, input = $('stock-history-at-date'), status = $('stock-history-at-date-status');
        if (!input.value) input.value = shToday();
        const date = input.value;
        const sequence = ++stockAtDateSequence, requestGeneration = sessionGeneration;
        stockAtDateState = null;
        $('stock-history-at-date-rows').replaceChildren();
        $('stock-history-at-date-export').disabled = true;
        if (!port) { status.textContent = ''; return; }
        status.textContent = 'Chargement du stock à cette date…';
        try {
            const rows = await api('/rest/v1/rpc/qbox_stock_at_date', {selected_port:port, at_date:date}, true);
            if (sequence !== stockAtDateSequence || activeView !== 'stock-history' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            stockAtDateState = {port, date, rows};
            renderStockAtDate();
        } catch (error) {
            if (sequence === stockAtDateSequence) status.textContent = `Stock à cette date indisponible : ${error.message}`;
        }
    }

    function exportStockAtDate() {
        const state = stockAtDateState;
        if (!state || state.port !== portSelect.value) return;
        const search = shSearch();
        const header = ['Site', 'Date (début de journée, Madagascar)', 'Intrant', 'Catégorie', 'Unité', 'Stock', 'Réservé', 'Disponible ce jour-là', 'Disponible aujourd’hui', 'Évolution depuis'];
        const site = portSelect.selectedOptions[0]?.textContent || state.port;
        const lines = state.rows.filter(item => !search || item.name.toLocaleLowerCase('fr').includes(search)).map(item => {
            const now = BigInt(item.current_stock) - BigInt(item.current_reserved);
            if (item.stock === null) return [site, state.date, item.name, item.category, item.unit, 'Non suivi', '', '', now.toString(), ''];
            const then = BigInt(item.stock) - BigInt(item.reserved ?? 0);
            return [site, state.date, item.name, item.category, item.unit, item.stock, item.reserved ?? 0, then.toString(), now.toString(), (now - then).toString()];
        });
        // Un entier pur (même négatif) ne peut pas être une formule : pas de préfixe, il reste numérique dans le tableur.
        const cell = value => /^-?\d+$/.test(String(value ?? '')) ? `"${value}"` : historyCsvCell(value);
        const csv = '\ufeff' + [header, ...lines].map(row => row.map(cell).join(';')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = `qbox-stock-au-${state.date}.csv`;
        document.body.append(link);
        try { link.click(); } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    }

    // ---------- Courbe d'évolution (un intrant à la fois) ----------
    function renderStockHistoryEvolution() {
        clearStockHistoryCharts();
        const card = $('stock-history-charts'), note = $('stock-history-chart-note'), stats = $('stock-history-evolution-stats');
        const state = stockHistoryState;
        stats.replaceChildren();
        note.textContent = '';
        const counts = new Map();
        for (const entry of state.rows) counts.set(entry.product_name, (counts.get(entry.product_name) || 0) + 1);
        if (!counts.size) { card.classList.add('postgres-hidden'); return ''; }
        card.classList.remove('postgres-hidden');
        const names = [...counts.keys()].sort((a, b) => a.localeCompare(b, 'fr'));
        if (!counts.has(stockHistoryProduct))
            stockHistoryProduct = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'))[0][0];
        const select = $('stock-history-product');
        select.replaceChildren();
        for (const name of names) select.append(new Option(`${name} (${counts.get(name)})`, name));
        select.value = stockHistoryProduct;
        const name = stockHistoryProduct;
        const homonyms = state.products.filter(item => item.name === name);
        const product = homonyms.length === 1 ? homonyms[0] : null;
        const entries = state.rows.filter(entry => entry.product_name === name).reverse();
        const values = [], labels = [], meta = [], moves = [];
        const first = entries[0], hasStart = first.before_stock !== null;
        if (hasStart) {
            const start = BigInt(first.before_stock) - BigInt(first.before_reserved ?? first.after_reserved);
            values.push(Number(start));
            labels.push('Début');
            meta.push({title:'Avant le premier mouvement chargé', lines:[]});
            moves.push(0);
        }
        let lowest = hasStart ? BigInt(values[0]) : null, totalIn = 0n, totalOut = 0n;
        for (const entry of entries) {
            const after = BigInt(entry.after_stock), available = after - BigInt(entry.after_reserved);
            const change = entry.before_stock === null ? null : after - BigInt(entry.before_stock);
            if (change !== null && change > 0n) totalIn += change;
            if (change !== null && change < 0n) totalOut -= change;
            if (lowest === null || available < lowest) lowest = available;
            values.push(Number(available));
            labels.push(new Date(entry.occurred_at).toLocaleDateString('fr-FR', {timeZone:'Indian/Antananarivo', day:'2-digit', month:'short'}));
            meta.push({title:`${localDateTime(entry.occurred_at)} (Madagascar)`, lines:[
                `${entry.operation}${entry.reference ? ` · ${entry.reference}` : ''}`,
                change === null ? 'Variation du stock inconnue' : `Variation du stock : ${shSigned(change)}`
            ]});
            moves.push(change === null || change === 0n ? 0 : change > 0n ? 1 : -1);
        }
        const last = entries[entries.length - 1];
        const facts = [
            ['Disponible au début', hasStart ? number(BigInt(values[0])) : '—', ''],
            ['Disponible après le dernier', number(BigInt(last.after_stock) - BigInt(last.after_reserved)), 'sh-evo-strong'],
            ['Plus bas', number(lowest), ''],
            ['Entrées', `+${number(totalIn)}`, 'sh-evo-up'],
            ['Sorties', totalOut ? `−${number(totalOut)}` : '0', 'sh-evo-down']
        ];
        for (const [label, value, tone] of facts) {
            const fact = dsElement('div', `sh-evo-stat ${tone}`);
            fact.append(dsElement('span', '', label), dsElement('strong', '', value));
            stats.append(fact);
        }
        if (homonyms.length > 1) note.textContent = 'Plusieurs intrants portent ce nom : la courbe peut les mélanger.';
        else if (state.cursor) note.textContent = 'Courbe limitée aux mouvements chargés : chargez les plus anciens pour remonter plus loin.';
        if (typeof window.Chart !== 'function') {
            note.textContent = 'Courbe indisponible : Chart.js n’est pas chargé. Les chiffres ci-dessus restent exacts.';
            return '';
        }
        try {
            const threshold = product && product.min_threshold != null && BigInt(product.min_threshold) > 0n ? Number(product.min_threshold) : null;
            stockHistoryCharts.push(new window.Chart($('stock-history-line'), {
                type:'line',
                data:{labels, datasets:stockHistoryChartStyle.evolutionDatasets(values, moves, threshold)},
                options:stockHistoryChartStyle.evolutionOptions(meta, product?.unit || '', dsReducedMotion())
            }));
            return '';
        } catch (error) {
            clearStockHistoryCharts();
            note.textContent = `Courbe indisponible : ${error.message}`;
            return '';
        }
    }

    // ---------- Journal des mouvements ----------
    function appendStockHistoryMovement(entry) {
        const before = entry.before_stock === null ? null : BigInt(entry.before_stock);
        const after = BigInt(entry.after_stock), reserved = BigInt(entry.after_reserved);
        const row = document.createElement('tr');
        const when = dsElement('span', 'sh-when');
        const date = new Date(entry.occurred_at);
        when.append(dsElement('strong', '', date.toLocaleDateString('fr-FR', {timeZone:'Indian/Antananarivo'})),
            dsElement('small', '', date.toLocaleTimeString('fr-FR', {timeZone:'Indian/Antananarivo', hour:'2-digit', minute:'2-digit'})));
        when.title = `${localDateTime(entry.occurred_at)} (Madagascar)`;
        shCell(row, when);
        shCell(row, entry.product_name, 'sh-strong');
        const operation = dsElement('span', 'sh-operation');
        operation.append(dsElement('span', 'sh-op-chip', entry.operation));
        if (entry.reference) operation.append(dsElement('small', '', entry.reference));
        shCell(row, operation);
        shCell(row, shDelta(before === null ? null : after - before), 'sh-num');
        shCell(row, before === null ? 'Inconnu' : number(before), 'sh-num sh-muted');
        shCell(row, number(after), 'sh-num');
        const available = dsElement('span', '', number(after - reserved));
        if (reserved > 0n) available.title = `${number(reserved)} réservé(s) aux vols`;
        shCell(row, available, 'sh-num sh-strong');
        shCell(row, entry.performed_by_name || 'Nom non renseigné', 'sh-muted');
        $('stock-history-movements').append(row);
    }

    // ---------- Inventaires ----------
    function renderStockHistoryInventories(inventories, filter) {
        const list = $('stock-history-inventories'), search = (filter.search_text || '').toLocaleLowerCase('fr');
        for (const inventory of inventories) {
            const date = new Date(inventory.created_at).toLocaleDateString('sv-SE', {timeZone:'Indian/Antananarivo'});
            if ((filter.from_date && date < filter.from_date) || (filter.to_date && date > filter.to_date) ||
                (filter.operation_filter && filter.operation_filter !== 'Inventaire physique')) continue;
            const items = inventory.items.filter(item => !search || item.product_name.toLocaleLowerCase('fr').includes(search));
            if (!items.length) continue;
            stockHistoryState.inventories.push({...inventory, items});
            const gaps = items.filter(item => BigInt(item.difference) !== 0n).length;
            const card = dsElement('details', 'sh-inventory rounded-xl');
            const summary = dsElement('summary', 'sh-inventory-summary');
            const title = dsElement('span', 'sh-inventory-title');
            title.append(dsElement('strong', '', `${localDateTime(inventory.created_at)} (Madagascar)`),
                dsElement('small', '', `${inventory.created_by_name || 'Nom non renseigné'} · ${inventory.id}`));
            summary.append(title, dsElement('span', `sh-badge ${gaps ? 'sh-level-watch' : 'sh-level-good'}`,
                gaps ? `${gaps} écart(s) sur ${items.length} lot(s)` : `${items.length} lot(s) conformes`));
            const scroll = dsElement('div', 'sh-table-wrap sh-inventory-table');
            const table = dsElement('table', 'sh-table');
            const head = document.createElement('thead');
            const heading = document.createElement('tr');
            for (const label of ['Intrant', 'Lot', 'Attendu', 'Compté', 'Écart']) {
                const th = dsElement('th', ['Attendu', 'Compté', 'Écart'].includes(label) ? 'sh-num' : '', label);
                th.scope = 'col';
                heading.append(th);
            }
            head.append(heading);
            const body = document.createElement('tbody');
            for (const item of items) {
                const row = document.createElement('tr');
                shCell(row, item.product_name, 'sh-strong');
                shCell(row, item.lot);
                shCell(row, number(BigInt(item.system_quantity) - BigInt(item.in_delivery)), 'sh-num');
                shCell(row, number(item.counted), 'sh-num');
                const gap = BigInt(item.difference);
                shCell(row, dsElement('span', `sh-delta ${gap > 0n ? 'sh-delta-up' : gap < 0n ? 'sh-delta-down' : 'sh-delta-flat'}`, number(gap)), 'sh-num');
                body.append(row);
            }
            table.append(head, body);
            scroll.append(table);
            card.append(summary, scroll);
            if (inventory.observations) {
                const note = dsElement('p', 'sh-inventory-note', `Remarques et observations : ${inventory.observations}`);
                note.style.whiteSpace = 'pre-wrap';
                card.append(note);
            }
            list.append(card);
        }
        if (!list.children.length) list.append(dsElement('p', 'sh-empty', 'Aucun inventaire pour ces filtres.'));
    }

    // ---------- Chargement ----------
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
            clearStockHistoryView();
        }
        if (!port) { status.textContent = 'Aucun port disponible.'; return; }
        if (filter.from_date && filter.to_date && filter.from_date > filter.to_date) {
            stockHistoryState = null;
            clearStockHistoryView();
            status.textContent = 'La date de début doit précéder ou égaler la date de fin.';
            return;
        }
        if (!loadMore) refreshStockAtDate();
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
                    const balance = balances.get(stock.product_id) || {name:stock.name, unit:stock.unit || product?.unit || '', quantity:0n, reserved:0n,
                        threshold:product?.min_threshold == null ? null : BigInt(product.min_threshold)};
                    balance.quantity += BigInt(stock.quantity);
                    balance.reserved += BigInt(stock.reserved);
                    balances.set(stock.product_id, balance);
                }
                stockHistoryState.balances = balances;
                renderStockHistorySummary();
                renderStockHistoryInventories(inventories, filter);
            }
            for (const entry of rows) appendStockHistoryMovement(entry);
            stockHistoryState.count += rows.length;
            stockHistoryState.rows.push(...rows);
            stockHistoryState.cursor = rows.length === 100 ? {time:rows[rows.length - 1].occurred_at, id:rows[rows.length - 1].id} : null;
            more.classList.toggle('hidden', !stockHistoryState.cursor);
            if (!stockHistoryState.count) {
                const row = dsElement('tr', 'sh-empty-row');
                shCell(row, 'Aucun mouvement pour ces filtres.').colSpan = 8;
                $('stock-history-movements').append(row);
            }
            $('stock-history-count').textContent = `${number(stockHistoryState.count)}${stockHistoryState.cursor ? '+' : ''} mouvement(s)`;
            renderStockHistoryKpis();
            status.textContent = `${stockHistoryState.count} mouvement(s) chargé(s)${stockHistoryState.cursor ? ' ; d’autres mouvements peuvent être chargés.' : '.'}${renderStockHistoryEvolution()}`;
        } catch (error) {
            if (sequence === requestSequence && activeView === 'stock-history' && port === portSelect.value && sessionGeneration === requestGeneration)
                status.textContent = `Lecture indisponible : ${error.message}`;
        } finally {
            if (sequence === requestSequence) more.disabled = false;
        }
    }

    function selectStockHistoryProduct() {
        if (!stockHistoryState) return;
        stockHistoryProduct = $('stock-history-product').value;
        renderStockHistoryEvolution();
    }

    // ---------- Impression et export du journal ----------
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
            ['h2', 'Stock actuel']
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
        table(['Intrant', 'État', 'Stock', 'Réservé', 'Disponible'], [...state.balances.values()].map(item =>
            [item.name, shLevel(item.quantity - item.reserved, item.threshold).label, number(item.quantity), number(item.reserved), number(item.quantity - item.reserved)]));
        const atDate = stockAtDateState;
        if (atDate && atDate.port === state.port) {
            const search = shSearch();
            const atTitle = document.createElement('h2');
            atTitle.textContent = `Stock au ${shDateLabel(atDate.date)}, avant toute opération du jour`;
            report.append(atTitle);
            table(['Intrant', 'Stock', 'Réservé', 'Disponible ce jour-là', 'Disponible aujourd’hui'],
                atDate.rows.filter(item => !search || item.name.toLocaleLowerCase('fr').includes(search)).map(item => {
                    const now = number(BigInt(item.current_stock) - BigInt(item.current_reserved));
                    if (item.stock === null) return [item.name, 'Non suivi', '', '', now];
                    return [item.name, number(item.stock), number(item.reserved ?? 0), number(BigInt(item.stock) - BigInt(item.reserved ?? 0)), now];
                }));
        }
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

    async function refreshLogisticsReport() {
            refreshPerformanceIndicators();
            const port = portSelect.value;
            const year = Number($('logistics-report-year').value);
            const requestGeneration = sessionGeneration;
            const sequence = ++logisticsReportSequence;
            const container = $('logistics-report-months');
            const reportStatus = $('logistics-report-status');
            logisticsReportState = null;
            $('logistics-report-print').disabled = true;
            $('logistics-report-print-context').textContent = '';
            $('logistics-report-print-header').replaceChildren();
            container.replaceChildren();
            clearLogisticsSummary();
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
                    const monthStatus = logisticsMonthStatus(month.items);
                    section.className = `logistics-month lr-month-${monthStatus}`;
                    section.id = `logistics-month-${month.month}`;
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
                        outgoingDetails.append(total, logisticsOutgoingBar(item), breakdown);
                        outgoing.append(outgoingDetails);
                        const closing = document.createElement('td');
                        closing.textContent = formatQuantity(item.closing_stock);
                        if (item.reconciliation_status === 'unreconciled' || item.reconciliation_status === 'unknown') {
                            const reconciliation = document.createElement('span');
                            reconciliation.className = `logistics-inventory-date lr-flag lr-flag-${item.reconciliation_status}`;
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
                    section.append(title, logisticsMonthMeta(month.items, monthStatus), wrapper);
                    container.append(section);
                }
                renderLogisticsSummary(result.months, year);
                reportStatus.textContent = Array.isArray(result.warnings) && result.warnings.length
                    ? result.warnings.join(' ') : 'Rapport actualisé.';
                const warehouse = warehouseRows.find(row => row.id === port);
                if (!warehouse) throw new Error('Magasin sélectionné introuvable.');
                $('logistics-report-print-context').textContent = `Magasin : ${warehouse.name} · ${warehouse.region} | Année : ${year}`;
                // En-tête commun aux impressions ; créé dès le chargement pour que le logo soit prêt à l'impression.
                $('logistics-report-print-header').replaceChildren(planningPrintHeader('RAPPORT LOGISTIQUE', null, warehouse, `Année ${year} · mouvements mensuels par intrant`));
                logisticsReportState = { port, year, warehouse };
                $('logistics-report-print').disabled = false;
            } catch (error) {
                if (sequence !== logisticsReportSequence || activeView !== 'logistics-report' ||
                    port !== portSelect.value || year !== Number($('logistics-report-year').value) || requestGeneration !== sessionGeneration) return;
                container.replaceChildren();
                clearLogisticsSummary();
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
        // Date d'édition mise à jour au moment d'imprimer (le logo déjà chargé est réutilisé par le navigateur).
        const {warehouse, year} = logisticsReportState;
        $('logistics-report-print-header').replaceChildren(planningPrintHeader('RAPPORT LOGISTIQUE', null, warehouse, `Année ${year} · mouvements mensuels par intrant`));
        document.body.classList.add('logistics-report-print-mode');
        try {
            window.print();
        } catch (error) {
            document.body.classList.remove('logistics-report-print-mode');
            $('logistics-report-status').textContent = `Impression impossible : ${error.message}`;
        }
    }

    // ---------- Indicateurs de performance (Rapport logistique) ----------
    let indicatorsSequence = 0;
    const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    function clearPerformanceIndicators() {
        indicatorsSequence++;
        $('indicators-body').replaceChildren();
        $('indicators-status').textContent = '';
        $('indicators-export').disabled = true;
    }

    // Moyenne des délais pondérée par le nombre de livraisons de chaque mois.
    function weightedDays(months, countKey, daysKey) {
        let count = 0, total = 0;
        for (const month of months) {
            if (month[daysKey] === null || month[daysKey] === undefined || !month[countKey]) continue;
            count += month[countKey];
            total += Number(month[daysKey]) * month[countKey];
        }
        return count ? total / count : null;
    }

    function indicatorRow(label, values, strong = false) {
        const row = document.createElement('tr');
        row.className = strong ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50';
        for (const [index, value] of [label, ...values].entries()) {
            const cell = document.createElement('td');
            cell.className = `py-2 px-3 ${index ? 'font-mono text-right' : 'text-slate-900'}`;
            cell.textContent = value;
            row.append(cell);
        }
        return row;
    }

    async function refreshPerformanceIndicators() {
        clearPerformanceIndicators();
        const port = portSelect.value, year = Number($('logistics-report-year').value);
        const sequence = indicatorsSequence, requestGeneration = sessionGeneration;
        if (!port) return;
        $('indicators-status').textContent = 'Chargement des indicateurs…';
        try {
            const result = await api('/rest/v1/rpc/qbox_performance_indicators', { selected_port: port, selected_year: year }, true);
            if (sequence !== indicatorsSequence || activeView !== 'logistics-report' || port !== portSelect.value ||
                year !== Number($('logistics-report-year').value) || requestGeneration !== sessionGeneration) return;
            const months = result?.months;
            if (!Array.isArray(months) || months.length !== 12) throw new Error('Données des indicateurs invalides.');
            const days = value => value === null || value === undefined ? '—' : decimal(Number(value));
            const body = $('indicators-body');
            for (const month of months) {
                body.append(indicatorRow(MONTH_NAMES[month.month - 1], [
                    String(month.flights_closed), days(month.flight_avg_days),
                    String(month.shipments_closed), days(month.shipment_avg_days),
                    String(month.plannings_ended), month.satisfaction_pct === null ? '—' : `${decimal(Number(month.satisfaction_pct))} %`,
                    String(month.stockout_products),
                    `${number(month.quarantined)} (${number(month.quarantined_expired)})`
                ]));
            }
            // Ligne annuelle : sommes, délais pondérés, satisfaction = livré ÷ planifié sur l'année.
            const sum = key => months.reduce((total, month) => total + BigInt(month[key]), 0n);
            const planned = sum('planned'), delivered = sum('delivered');
            const flightDays = weightedDays(months, 'flights_closed', 'flight_avg_days');
            const shipmentDays = weightedDays(months, 'shipments_closed', 'shipment_avg_days');
            body.append(indicatorRow(`Année ${year}`, [
                String(months.reduce((total, month) => total + month.flights_closed, 0)), flightDays === null ? '—' : decimal(flightDays),
                String(months.reduce((total, month) => total + month.shipments_closed, 0)), shipmentDays === null ? '—' : decimal(shipmentDays),
                String(months.reduce((total, month) => total + month.plannings_ended, 0)),
                planned > 0n ? `${decimal(Number(delivered * 1000n / planned) / 10)} %` : '—',
                String(months.reduce((total, month) => total + month.stockout_products, 0)),
                `${number(sum('quarantined'))} (${number(sum('quarantined_expired'))})`
            ], true));
            $('indicators-export').disabled = false;
            $('indicators-status').textContent = '';
        } catch (error) {
            if (sequence === indicatorsSequence && requestGeneration === sessionGeneration)
                $('indicators-status').textContent = `Indicateurs indisponibles : ${error.message}`;
        }
    }

    function exportPerformanceIndicators() {
        const site = portSelect.selectedOptions[0]?.textContent || '';
        downloadTableCsv($('indicators-body').closest('table'), tableCsvFileName(`indicateurs-${$('logistics-report-year').value}`, site));
    }

    // ---------- Rapport logistique : éléments d'écran (style : logistics-report.css) ----------
    // Synthèse de l'année, graphique entrées / sorties, navigation par mois, en-têtes de mois et
    // répartition des sorties. Tous marqués « no-print » : l'impression du rapport reste inchangée.
    const LR_MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    const LR_STATUS = {
        ok: ['Réconcilié', 'ph-check-circle'], warn: ['Écarts à vérifier', 'ph-warning'],
        unknown: ['Réconciliation indisponible', 'ph-question'], future: ['Mois à venir', 'ph-hourglass-medium'],
        empty: ['Aucun intrant', 'ph-minus-circle']
    };

    function lrElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function lrIcon(name) {
        const icon = lrElement('i', `ph ${name}`);
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    const lrBig = value => { try { return value == null ? 0n : BigInt(value); } catch { return 0n; } };
    const lrSum = (items, key) => items.reduce((total, item) => total + lrBig(item[key]), 0n);

    function logisticsMonthStatus(items) {
        if (!items.length) return 'empty';
        if (items.every(item => item.flows_status === 'future')) return 'future';
        if (items.some(item => item.reconciliation_status === 'unreconciled')) return 'warn';
        if (items.some(item => item.reconciliation_status === 'unknown')) return 'unknown';
        return 'ok';
    }

    // Pastilles du mois : entrées, sorties, inventaire et statut de réconciliation.
    function logisticsMonthMeta(items, status) {
        const meta = lrElement('div', 'lr-month-meta no-print');
        if (status !== 'future' && items.length) {
            meta.append(lrElement('span', 'lr-chip lr-chip-in', `↓ Entrées ${number(lrSum(items, 'incoming'))}`),
                lrElement('span', 'lr-chip lr-chip-out', `↑ Sorties ${number(lrSum(items, 'outgoing'))}`));
            if (items.some(item => item.inventory_status === 'counted'))
                meta.append(lrElement('span', 'lr-chip lr-chip-inventory', 'Inventaire de fin de mois'));
        }
        const [label, icon] = LR_STATUS[status];
        const pill = lrElement('span', `lr-status lr-status-${status}`);
        pill.append(lrIcon(icon), lrElement('span', '', label));
        meta.append(pill);
        return meta;
    }

    // Barre de répartition des sorties (vol, terrestre, transfert, autres).
    function logisticsOutgoingBar(item) {
        const bar = lrElement('span', 'lr-split no-print');
        const total = lrBig(item.outgoing);
        if (total <= 0n) return bar;
        bar.setAttribute('role', 'img');
        const parts = [['flight', item.flight_outgoing, 'Vol'], ['road', item.terrestrial_outgoing, 'Terrestre'],
            ['transfer', item.transfer_outgoing, 'Transfert'], ['other', item.other_outgoing, 'Autres']]
            .filter(([, value]) => lrBig(value) > 0n);
        bar.setAttribute('aria-label', parts.map(([, value, label]) => `${label} ${number(lrBig(value))}`).join(', '));
        for (const [kind, value, label] of parts) {
            const segment = lrElement('i', `lr-split-${kind}`);
            segment.style.flexGrow = String(Number(lrBig(value) * 1000n / total));
            segment.title = `${label} : ${number(lrBig(value))}`;
            bar.append(segment);
        }
        return bar;
    }

    function clearLogisticsSummary() {
        for (const id of ['logistics-report-summary', 'logistics-report-nav']) $(id).replaceChildren();
    }

    function scrollToLogisticsMonth(month) {
        $(`logistics-month-${month}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }

    function renderLogisticsSummary(months, year) {
        clearLogisticsSummary();
        const all = months.flatMap(month => month.items);
        const recorded = months.filter(month => month.items.length && logisticsMonthStatus(month.items) !== 'future');
        const balanced = recorded.filter(month => logisticsMonthStatus(month.items) === 'ok').length;
        const inventories = recorded.filter(month => month.items.some(item => item.inventory_status === 'counted')).length;
        const products = new Set(all.map(item => item.product_id)).size;
        const incoming = lrSum(all, 'incoming'), outgoing = lrSum(all, 'outgoing');

        // Indicateurs de l'année.
        const summary = $('logistics-report-summary');
        const kpis = lrElement('div', 'lr-kpis');
        for (const [label, icon, value, hint, tone] of [
            ['Entrées de l’année', 'ph-arrow-circle-down', number(incoming), `Réceptions ${number(lrSum(all, 'receipt_incoming'))} · transferts ${number(lrSum(all, 'transfer_incoming'))}`, 'in'],
            ['Sorties de l’année', 'ph-arrow-circle-up', number(outgoing), `Vols ${number(lrSum(all, 'flight_outgoing'))} · terrestre ${number(lrSum(all, 'terrestrial_outgoing'))} · transferts ${number(lrSum(all, 'transfer_outgoing'))}`, 'out'],
            ['Mois réconciliés', 'ph-scales', `${balanced} / ${recorded.length}`, recorded.length && balanced < recorded.length ? 'Des écarts restent à vérifier' : 'Soldes cohérents avec les mouvements', balanced < recorded.length ? 'warn' : 'ok'],
            ['Inventaires de fin de mois', 'ph-clipboard-text', `${inventories} / ${recorded.length}`, `${products} intrant(s) suivi(s) en ${year}`, inventories < recorded.length ? 'warn' : 'ok']
        ]) {
            const tile = lrElement('div', `lr-kpi lr-kpi-${tone}`);
            const head = lrElement('span', 'lr-kpi-label');
            head.append(lrIcon(icon), lrElement('span', '', label));
            tile.append(head, lrElement('strong', 'lr-kpi-value', value), lrElement('span', 'lr-kpi-hint', hint));
            kpis.append(tile);
        }

        // Graphique : entrées et sorties par mois (cliquer pour aller au mois).
        const chart = lrElement('div', 'lr-chart');
        const chartHead = lrElement('div', 'lr-chart-head');
        chartHead.append(lrElement('strong', '', `Flux mensuels ${year}`));
        const legend = lrElement('span', 'lr-chart-legend');
        legend.append(lrElement('i', 'lr-dot lr-dot-in'), lrElement('span', '', 'Entrées'), lrElement('i', 'lr-dot lr-dot-out'), lrElement('span', '', 'Sorties'));
        chartHead.append(legend);
        const bars = lrElement('div', 'lr-bars');
        const totals = months.map(month => ({ month: month.month, incoming: lrSum(month.items, 'incoming'), outgoing: lrSum(month.items, 'outgoing'),
            status: logisticsMonthStatus(month.items) }));
        const max = totals.reduce((top, month) => [month.incoming, month.outgoing, top].reduce((a, b) => a > b ? a : b), 1n);
        for (const month of totals) {
            const column = lrElement('button', `lr-bar-col lr-col-${month.status}`);
            column.type = 'button';
            column.title = `${LR_MONTHS[month.month - 1]} : entrées ${number(month.incoming)}, sorties ${number(month.outgoing)}`;
            column.setAttribute('aria-label', column.title);
            const pair = lrElement('span', 'lr-bar-pair');
            for (const [kind, value] of [['in', month.incoming], ['out', month.outgoing]]) {
                const bar = lrElement('i', `lr-bar lr-bar-${kind}`);
                bar.style.height = `${value > 0n ? Math.max(3, Number(value * 1000n / max) / 10) : 0}%`;
                pair.append(bar);
            }
            column.append(pair, lrElement('span', 'lr-bar-label', LR_MONTHS[month.month - 1]));
            column.addEventListener('click', () => scrollToLogisticsMonth(month.month));
            bars.append(column);
        }
        chart.append(chartHead, bars);
        summary.append(kpis, chart);

        // Navigation par mois (pastille colorée selon le statut).
        const nav = $('logistics-report-nav');
        for (const month of totals) {
            const chip = lrElement('button', `lr-nav-chip lr-col-${month.status}`);
            chip.type = 'button';
            chip.append(lrElement('i', 'lr-nav-dot'), lrElement('span', '', LR_MONTHS[month.month - 1]));
            chip.title = LR_STATUS[month.status][0];
            chip.addEventListener('click', () => scrollToLogisticsMonth(month.month));
            nav.append(chip);
        }
        // Légende des barres de sorties des tableaux.
        const splitLegend = lrElement('span', 'lr-split-legend');
        splitLegend.append(lrElement('span', '', 'Sorties :'));
        for (const [kind, label] of [['flight', 'Vol'], ['road', 'Terrestre'], ['transfer', 'Transfert'], ['other', 'Autres']])
            splitLegend.append(lrElement('i', `lr-split-${kind}`), lrElement('span', '', label));
        nav.append(splitLegend);
    }

    // Écart d'inventaire (compté − théorique) : null = pas encore saisi.
    function inventoryGapKind(difference) {
        if (difference === null || difference === undefined || difference === '') return 'none';
        const gap = BigInt(difference);
        return gap === 0n ? 'ok' : gap > 0n ? 'surplus' : 'missing';
    }

    function inventoryGapRowClass(difference) {
        const kind = inventoryGapKind(difference);
        return kind === 'surplus' || kind === 'missing' ? `inv-row-${kind}` : '';
    }

    function inventoryGapBadge(difference) {
        const kind = inventoryGapKind(difference);
        const badge = document.createElement('span');
        badge.className = `inv-gap inv-gap-${kind}`;
        if (kind === 'none') {
            badge.textContent = '—';
            badge.title = 'Quantité pas encore comptée';
            return badge;
        }
        const gap = BigInt(difference);
        const size = number(gap < 0n ? -gap : gap);
        badge.textContent = kind === 'ok' ? '0 · Conforme' : kind === 'surplus' ? `+${size} · Surplus` : `−${size} · Manquant`;
        badge.title = kind === 'ok' ? 'Le comptage correspond au stock théorique'
            : kind === 'surplus' ? `${size} unité(s) de plus que le stock théorique` : `${size} unité(s) de moins que le stock théorique`;
        return badge;
    }

    function inventoryGapSummary(items) {
        const wrap = document.createElement('span');
        wrap.className = 'inv-summary-badges';
        const missing = items.filter(item => inventoryGapKind(item.difference) === 'missing').length;
        const surplus = items.filter(item => inventoryGapKind(item.difference) === 'surplus').length;
        const add = (kind, text) => {
            const badge = document.createElement('span');
            badge.className = `inv-gap inv-gap-${kind}`;
            badge.textContent = text;
            wrap.append(badge);
        };
        if (!missing && !surplus) add('ok', 'Aucun écart');
        if (missing) add('missing', `${missing} lot(s) manquant(s)`);
        if (surplus) add('surplus', `${surplus} lot(s) en surplus`);
        return wrap;
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
                card.className = 'inv-card border border-slate-200 rounded-xl overflow-hidden';
                const summary = document.createElement('summary');
                summary.className = 'inv-summary p-3 cursor-pointer text-xs font-bold text-slate-800';
                const summaryText = document.createElement('span');
                summaryText.className = 'inv-summary-text';
                summaryText.textContent = `${localDateTime(inventory.created_at)} (Madagascar) · ${inventory.created_by_name || 'Nom non renseigné'} · ${inventory.items.length} lot(s)`;
                const summaryId = document.createElement('span');
                summaryId.className = 'inv-summary-id';
                summaryId.textContent = inventory.id;
                summary.append(summaryText, inventoryGapSummary(inventory.items), summaryId);
                const scroll = document.createElement('div');
                scroll.className = 'overflow-x-auto border-t border-slate-200';
                const table = document.createElement('table');
                table.className = 'inv-table w-full text-xs text-left';
                const header = document.createElement('tr');
                header.className = 'text-slate-500';
                for (const [index, label] of ['Intrant / lot', 'Théorique physique', 'En livraison', 'Compté', 'Écart'].entries()) {
                    const th = document.createElement('th');
                    th.scope = 'col';
                    th.className = index ? 'p-2 text-right' : 'p-2';
                    th.textContent = label;
                    header.append(th);
                }
                const head = document.createElement('thead');
                head.append(header);
                const body = document.createElement('tbody');
                for (const item of inventory.items) {
                    const expected = BigInt(item.system_quantity) - BigInt(item.in_delivery);
                    const row = tableRow([`${item.product_name} · Lot ${item.lot}`, number(expected),
                        number(item.in_delivery), number(item.counted), '']);
                    row.className = `border-t border-slate-100 ${inventoryGapRowClass(item.difference)}`;
                    // children est une HTMLCollection dans le navigateur (pas de forEach).
                    Array.from(row.children).forEach((cell, index) => { if (index) cell.classList.add('inv-num'); });
                    row.children[4].replaceChildren(inventoryGapBadge(item.difference));
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
            renderInventoryReport(inventory, selectedPort.name, $('inventory-print-report'), selectedPort.region);
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
            inventoryDraft = {port, revision:snapshot.revision, id:crypto.randomUUID(), items:snapshot.items, inputs:new Map(), products:null};
            $('inventory-observations').value = '';
            const rows = $('inventory-count-rows');
            rows.replaceChildren();
            for (const item of snapshot.items) {
                const row = document.createElement('tr');
                for (const [index, value] of [`${item.product_name} · Lot ${item.lot}`, number(item.expected), number(item.in_delivery)].entries()) {
                    const cell = document.createElement('td');
                    cell.className = index ? 'p-2 inv-num' : 'p-2';
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
                inventoryDraft.inputs.set(item.stock_id, input);
                input.className = 'postgres-inventory-count inv-count-input w-full border rounded-lg p-2';
                input.setAttribute('aria-label', `Quantité comptée : ${item.product_name}, lot ${item.lot}`);
                const difference = document.createElement('td');
                difference.className = 'p-2 text-right';
                difference.replaceChildren(inventoryGapBadge(null));
                input.addEventListener('input', () => {
                    const value = Number(input.value);
                    const gap = input.value !== '' && Number.isSafeInteger(value) && value >= 0
                        ? BigInt(value) - BigInt(item.expected) : null;
                    difference.replaceChildren(inventoryGapBadge(gap));
                    row.className = inventoryGapRowClass(gap);
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

    // --- Formulaire planning : sélection multiple de CSB, lignes d'intrants issues du référentiel ---
    // Les éléments sont suivis en mémoire (CSB -> bloc, intrant -> ligne) ; la soumission relit les
    // champs nommés csb / product / quantity du formulaire.
    const planningEntries = new Map();
    const planningOptions = new Map();

    function planningElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function planningIcon(name) {
        const icon = planningElement('i', `ph ${name}`);
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function planningHidden(name, value) {
        const input = planningElement('input');
        Object.assign(input, {type: 'hidden', name, value});
        return input;
    }

    // Une ligne est renseignée si elle a un besoin, ou si le calcul conclut à un besoin nul (stock suffisant).
    const planningFilled = entry => [...entry.rows.values()]
        .filter(row => String(row.input.value ?? '').trim() !== '' || row.computed === 0).length;

    // CSB regroupés par district : ordre alphabétique, district non renseigné en dernier,
    // ordre du référentiel conservé à l'intérieur de chaque district.
    const planningDistrictOf = csb => csb.district || NO_DISTRICT;
    function planningCsbsByDistrict(csbs) {
        const districts = new Map();
        for (const csb of csbs) {
            const name = planningDistrictOf(csb);
            if (!districts.has(name)) districts.set(name, []);
            districts.get(name).push(csb);
        }
        return [...districts].sort(([a], [b]) => a === NO_DISTRICT ? 1 : b === NO_DISTRICT ? -1 : a.localeCompare(b, 'fr'));
    }
    // District → case « tout le district » du sélecteur / en-tête de district des blocs de saisie.
    const planningPickerDistricts = new Map();
    const planningBlockDistricts = new Map();

    function resetPlanningForm() {
        planningEntries.clear();
        planningOptions.clear();
        planningPickerDistricts.clear();
        planningBlockDistricts.clear();
        $('plan-csb-blocks').replaceChildren();
        $('plan-csb-options').replaceChildren();
        updatePlanningSummary();
    }

    // Avancement de la saisie par district, puis récapitulatif en pied de formulaire.
    function updatePlanningDistrictStats() {
        for (const {stats, entries} of planningBlockDistricts.values()) {
            const total = entries.reduce((sum, entry) => sum + entry.rows.size, 0);
            const filled = entries.reduce((sum, entry) => sum + planningFilled(entry), 0);
            stats.textContent = `${filled} / ${total} ligne(s) renseignée(s)`;
            stats.className = `plan-district-stats${total && filled === total ? ' is-complete' : filled ? ' is-partial' : ''}`;
        }
        updatePlanningSummary();
    }

    function updatePlanningSummary() {
        let lines = 0, filled = 0, total = 0n;
        for (const entry of planningEntries.values()) {
            lines += entry.rows.size;
            filled += planningFilled(entry);
            for (const row of entry.rows.values()) {
                const value = planningWhole(row.input);
                if (typeof value === 'number' && !Number.isNaN(value)) total += BigInt(value);
            }
        }
        $('plan-form-summary').textContent = planningEntries.size
            ? `${planningEntries.size} CSB · ${filled} / ${lines} ligne(s) renseignée(s) · besoin total : ${number(total)}`
            : 'Aucun CSB sélectionné';
    }

    function updatePlanningBlock(entry) {
        const total = entry.rows.size, filled = planningFilled(entry);
        entry.badge.textContent = `${filled} / ${total} intrant(s) renseigné(s)`;
        entry.badge.className = `px-2 py-0.5 rounded-full text-[10px] font-bold ${
            total && filled === total ? 'bg-emerald-100 text-emerald-800' : filled ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`;
        // Badge d'état à côté du nom du CSB : lignes encore vides ou CSB entièrement rempli.
        const empty = total - filled;
        const [icon, label, tone] = !total ? ['ph-minus-circle', 'Aucun intrant', 'bg-slate-100 text-slate-600 border-slate-200']
            : empty ? ['ph-warning', `${empty} ligne(s) vide(s)`, 'bg-amber-50 text-amber-800 border-amber-200']
            : ['ph-check-circle', 'Rempli', 'bg-emerald-50 text-emerald-700 border-emerald-200'];
        entry.status.className = `planning-csb-status inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${tone}`;
        entry.status.replaceChildren(planningIcon(icon), planningElement('span', '', label));
        entry.status.title = empty ? 'Des lignes d’intrant n’ont pas de quantité : elles ne seront pas enregistrées.' : '';
        entry.empty.hidden = total > 0;
        entry.head.hidden = total === 0;
        const missing = planningProducts.filter(product => !entry.rows.has(product.id));
        entry.select.replaceChildren();
        entry.select.add(new Option(missing.length ? `Ajouter un intrant du référentiel (${missing.length} disponible(s))…` : 'Tous les intrants du référentiel sont présents', ''));
        for (const product of missing) entry.select.add(new Option(`${product.code} · ${product.name}`, product.id));
        entry.select.value = '';
        entry.select.disabled = !missing.length;
        entry.add.disabled = !missing.length;
        updatePlanningDistrictStats();
    }

    // Besoin proposé = CMM × 4 − état de stock (jamais négatif), ajustable par l'utilisateur.
    const PLANNING_CMM_MONTHS = 4;
    const PLANNING_GRID = 'grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_8rem_2rem] gap-2';

    const planningWhole = input => {
        const raw = String(input.value ?? '').trim();
        if (raw === '') return null;
        const value = Number(raw);
        return Number.isSafeInteger(value) && value >= 0 ? value : NaN;
    };

    // null : CMM non saisie ; NaN : saisie invalide ; sinon le besoin calculé.
    function planningComputedNeed(state) {
        const cmm = planningWhole(state.cmm), stock = planningWhole(state.stock);
        if (cmm === null) return null;
        if (Number.isNaN(cmm) || Number.isNaN(stock)) return NaN;
        return Math.max(0, cmm * PLANNING_CMM_MONTHS - (stock ?? 0));
    }

    function updatePlanningNeed(state) {
        const computed = planningComputedNeed(state);
        const cmm = planningWhole(state.cmm), stock = planningWhole(state.stock) ?? 0;
        state.computed = computed;
        if (computed === null) state.hint.textContent = '';
        else if (Number.isNaN(computed)) state.hint.textContent = 'Saisie invalide';
        else state.hint.textContent = `${PLANNING_CMM_MONTHS} × ${number(cmm)} − ${number(stock)} = ${number(computed)}${computed === 0 ? ' · aucun besoin' : ''}`;
        const current = planningWhole(state.input);
        state.adjusted = typeof computed === 'number' && !Number.isNaN(computed) && current !== null && current !== computed;
        state.adjustedBadge.hidden = !state.adjusted;
        state.reset.hidden = !state.adjusted;
    }

    function applyPlanningNeed(state) {
        const computed = planningComputedNeed(state);
        if (typeof computed === 'number' && !Number.isNaN(computed)) state.input.value = computed > 0 ? String(computed) : '';
        state.manual = false;
        updatePlanningNeed(state);
    }

    function planningNumberInput(name, label, placeholder, min = '0') {
        const input = planningElement('input', 'w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-right focus:outline-none focus:border-amber-400');
        Object.assign(input, {name, type: 'number', min, max: '9007199254740991', step: '1', placeholder});
        input.setAttribute('aria-label', label);
        return input;
    }

    function addPlanningRow(entry, productId, quantity = '', evaluation = {}) {
        const product = planningProducts.find(item => item.id === productId);
        if (!product || entry.rows.has(product.id)) return null;
        const row = planningElement('div', `planning-item ${PLANNING_GRID} items-start px-3 py-2 hover:bg-slate-50`);
        row.dataset.product = product.id;
        const info = planningElement('div', 'min-w-0 pt-1');
        const name = planningElement('div', 'text-xs font-semibold text-slate-800 truncate', product.name);
        name.title = product.name;
        info.append(name, planningElement('div', 'text-[10px] text-slate-500 truncate',
            [product.code, product.category, product.unit].filter(Boolean).join(' · ')));
        const stock = planningNumberInput('stock_level', `État de stock — ${product.name}`, 'Stock');
        const cmm = planningNumberInput('cmm', `CMM — ${product.name}`, 'CMM');
        // Valeurs enregistrées (modification d'une campagne) : le besoin enregistré est conservé tel quel.
        if (evaluation.stock_level !== null && evaluation.stock_level !== undefined) stock.value = String(evaluation.stock_level);
        if (evaluation.cmm !== null && evaluation.cmm !== undefined) cmm.value = String(evaluation.cmm);
        const input = planningNumberInput('quantity', `Besoin prévu — ${product.name}`, 'Besoin', '1');
        if (quantity !== '' && quantity !== null && quantity !== undefined) input.value = String(quantity);
        const need = planningElement('div', 'space-y-1');
        const hint = planningElement('div', 'text-[10px] text-slate-500 font-mono text-right leading-tight');
        const tools = planningElement('div', 'flex items-center justify-end gap-1');
        const adjustedBadge = planningElement('span', 'px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[9px] font-bold', 'Ajusté');
        adjustedBadge.title = 'Le besoin a été modifié à la main par rapport au calcul.';
        const reset = planningElement('button', 'text-[10px] font-bold text-sky-700 hover:underline', 'Recalculer');
        reset.type = 'button';
        reset.title = `Revenir au calcul ${PLANNING_CMM_MONTHS} × CMM − état de stock`;
        tools.append(adjustedBadge, reset);
        need.append(input, hint, tools);
        const remove = planningElement('button', 'w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors');
        remove.type = 'button';
        remove.title = 'Retirer cet intrant';
        remove.setAttribute('aria-label', `Retirer ${product.name}`);
        remove.append(planningIcon('ph-x'));
        const state = {row, input, stock, cmm, hint, adjustedBadge, reset, manual: false, adjusted: false, computed: null};
        // Stock ou CMM modifiés : le besoin suit le calcul tant que l'utilisateur ne l'a pas ajusté.
        const recompute = () => {
            if (!state.manual) applyPlanningNeed(state);
            else updatePlanningNeed(state);
            updatePlanningBlock(entry);
        };
        stock.addEventListener('input', recompute);
        cmm.addEventListener('input', recompute);
        input.addEventListener('input', () => {
            state.manual = String(input.value ?? '').trim() !== '';
            updatePlanningNeed(state);
            updatePlanningBlock(entry);
        });
        reset.addEventListener('click', () => { applyPlanningNeed(state); updatePlanningBlock(entry); });
        remove.addEventListener('click', () => {
            entry.rows.delete(product.id);
            entry.rowsBox.replaceChildren(...[...entry.rows.values()].map(item => item.row));
            updatePlanningBlock(entry);
        });
        row.append(planningHidden('product', product.id), info, stock, cmm, need, remove);
        entry.rows.set(product.id, state);
        entry.rowsBox.append(row);
        updatePlanningNeed(state);
        // Un besoin enregistré différent du calcul était un ajustement : il n'est pas écrasé par la suite.
        state.manual = state.adjusted;
        return row;
    }

    // Réaffiche les blocs regroupés par district, ou une invite si aucun CSB n'est coché.
    function renderPlanningBlocks() {
        planningBlockDistricts.clear();
        const sections = [];
        for (const [district, csbs] of planningCsbsByDistrict(planningCsbs)) {
            const entries = csbs.filter(csb => planningEntries.has(csb.id)).map(csb => planningEntries.get(csb.id));
            if (!entries.length) continue;
            const section = planningElement('section', district === NO_DISTRICT ? 'plan-district plan-district-none' : 'plan-district');
            section.dataset.district = district;
            const head = planningElement('div', 'plan-district-head');
            const name = planningElement('h5', 'plan-district-name');
            name.append(planningIcon('ph-map-pin-area'), planningElement('span', '', district));
            const stats = planningElement('span', 'plan-district-stats');
            head.append(name, planningElement('span', 'plan-district-count', `${entries.length} CSB`), stats);
            const list = planningElement('div', 'plan-district-blocks');
            list.append(...entries.map(entry => entry.block));
            section.append(head, list);
            planningBlockDistricts.set(district, {stats, entries});
            sections.push(section);
        }
        $('plan-csb-blocks').replaceChildren(...(sections.length ? sections : [planningElement('div', 'plan-blocks-empty',
            'Cochez un ou plusieurs CSB ci-dessus : leurs lignes d’intrants seront créées à partir du référentiel.')]));
        updatePlanningDistrictStats();
        syncPlanningPicker();
    }

    // items === null : nouveau CSB, une ligne vide par intrant du référentiel.
    function addPlanningCsb(csbId, items = null, render = true) {
        const csb = planningCsbs.find(item => item.id === csbId);
        if (!csb || planningEntries.has(csbId)) return null;
        const block = planningElement('details', 'planning-csb group border border-slate-200 rounded-xl bg-white overflow-hidden');
        block.dataset.csb = csb.id;
        block.open = false; // replié par défaut : seul un CSB ajouté à la main est déplié (openOnlyPlanningCsb)
        const summary = planningElement('summary', 'flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden');
        const title = planningElement('div', 'flex items-center gap-2 min-w-0');
        const status = planningElement('span');
        title.append(planningIcon('ph-caret-right text-slate-400 transition-transform group-open:rotate-90'),
            planningIcon('ph-map-pin text-rose-500'),
            planningElement('span', 'text-xs font-bold text-slate-900 truncate', csb.name),
            status,
            planningElement('span', 'font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded', csb.code),
            planningElement('span', 'hidden sm:inline text-[10px] text-slate-500 truncate', csb.region || ''));
        const actions = planningElement('div', 'flex items-center gap-2');
        const badge = planningElement('span');
        const remove = planningElement('button', 'inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors');
        remove.type = 'button';
        remove.setAttribute('aria-label', `Retirer le CSB ${csb.name}`);
        remove.textContent = 'Retirer ce CSB';
        remove.addEventListener('click', event => { event?.preventDefault?.(); event?.stopPropagation?.(); removePlanningCsb(csb.id); });
        actions.append(badge, remove);
        summary.append(title, actions);
        const body = planningElement('div', 'border-t border-slate-200');
        const head = planningElement('div', `${PLANNING_GRID} px-3 py-1.5 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100`);
        const needHead = planningElement('span', 'text-right', 'Besoin');
        needHead.title = `${PLANNING_CMM_MONTHS} × CMM − état de stock, ajustable`;
        head.append(planningElement('span', '', 'Intrant'), planningElement('span', 'text-right', 'État de stock'),
            planningElement('span', 'text-right', 'CMM'), needHead, planningElement('span'));
        const rowsBox = planningElement('div', 'divide-y divide-slate-100');
        const empty = planningElement('p', 'px-4 py-3 text-[11px] text-slate-500 italic', 'Aucun intrant pour ce CSB : ajoutez-en un depuis le référentiel ou retirez le CSB.');
        const footer = planningElement('div', 'flex flex-wrap items-center gap-2 px-3 py-2.5 bg-slate-50/60 border-t border-slate-100');
        const select = planningElement('select', 'flex-1 min-w-[180px] text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-400');
        select.setAttribute('aria-label', `Intrant à ajouter pour ${csb.name}`);
        const add = planningElement('button', 'inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-lg transition-colors');
        add.type = 'button';
        add.textContent = 'Ajouter un intrant';
        const entry = {csb, block, rowsBox, rows: new Map(), badge, status, select, add, empty, head};
        add.addEventListener('click', () => {
            const row = select.value && addPlanningRow(entry, select.value);
            if (!row) return;
            updatePlanningBlock(entry);
            entry.rows.get(row.dataset.product).stock.focus?.();
        });
        footer.append(select, add);
        // Défilement horizontal sur petit écran plutôt que des colonnes écrasées.
        const scroller = planningElement('div', 'overflow-x-auto');
        const grid = planningElement('div', 'min-w-[600px]');
        grid.append(head, rowsBox);
        scroller.append(grid);
        body.append(scroller, empty, footer);
        block.append(planningHidden('csb', csb.id), summary, body);
        planningEntries.set(csb.id, entry);
        if (items) items.forEach(item => addPlanningRow(entry, item.product_id, item.planned, item));
        else planningProducts.forEach(product => addPlanningRow(entry, product.id));
        updatePlanningBlock(entry);
        if (render) renderPlanningBlocks();
        return block;
    }

    function removePlanningCsb(csbId, ask = true) {
        const entry = planningEntries.get(csbId);
        if (!entry) return true;
        const filled = planningFilled(entry);
        if (ask && filled && !confirm(`Retirer ${entry.csb.name} de la campagne ? Les ${filled} quantité(s) saisie(s) pour ce CSB seront perdues.`)) {
            syncPlanningPicker();
            return false;
        }
        planningEntries.delete(csbId);
        renderPlanningBlocks();
        return true;
    }

    // Sélecteur des CSB par district, avec une case « tout le district » (agit sur les CSB visibles du district).
    function renderPlanningPicker() {
        planningOptions.clear();
        planningPickerDistricts.clear();
        $('plan-csb-search').value = '';
        const groups = planningCsbsByDistrict(planningCsbs).map(([district, csbs]) => {
            const section = planningElement('div', district === NO_DISTRICT ? 'plan-picker-district plan-picker-district-none' : 'plan-picker-district');
            const head = planningElement('label', 'plan-picker-head');
            const all = planningElement('input', 'accent-sky-600');
            all.type = 'checkbox';
            all.setAttribute('aria-label', `Tous les CSB du district ${district}`);
            const count = planningElement('span', 'plan-picker-count');
            const name = planningElement('span', 'plan-picker-name');
            name.append(planningIcon('ph-map-pin-area'), planningElement('span', '', district));
            head.append(all, name, count);
            const grid = planningElement('div', 'plan-picker-grid');
            const ids = csbs.map(csb => {
                const label = planningElement('label', 'plan-picker-option');
                const input = planningElement('input', 'accent-sky-600');
                input.type = 'checkbox';
                input.value = csb.id;
                input.addEventListener('change', () => {
                    if (input.checked) openOnlyPlanningCsb(addPlanningCsb(csb.id))?.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
                    else removePlanningCsb(csb.id);
                });
                const text = planningElement('span', 'plan-picker-text');
                text.append(planningElement('span', 'plan-picker-option-name', csb.name),
                    planningElement('span', 'plan-picker-option-meta', [csb.code, csb.region].filter(Boolean).join(' · ')));
                label.append(input, text);
                planningOptions.set(csb.id, {label, input,
                    search: [csb.name, csb.code, csb.district, csb.region].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR')});
                grid.append(label);
                return csb.id;
            });
            all.addEventListener('change', () => setPlanningCsbs(ids.filter(id => !planningOptions.get(id).label.hidden), all.checked, `du district ${district}`));
            section.append(head, grid);
            planningPickerDistricts.set(district, {section, input: all, count, ids});
            return section;
        });
        $('plan-csb-options').replaceChildren(...groups);
    }

    const visiblePlanningOptions = () => [...planningOptions.entries()].filter(([, option]) => !option.label.hidden);

    function syncPlanningPicker() {
        for (const [id, option] of planningOptions) {
            const checked = planningEntries.has(id);
            option.input.checked = checked;
            option.label.className = checked ? 'plan-picker-option is-checked' : 'plan-picker-option';
        }
        for (const {section, input, count, ids} of planningPickerDistricts.values()) {
            const visible = ids.filter(id => !planningOptions.get(id).label.hidden);
            const checkedVisible = visible.filter(id => planningEntries.has(id)).length;
            section.hidden = visible.length === 0;
            input.checked = visible.length > 0 && checkedVisible === visible.length;
            input.indeterminate = checkedVisible > 0 && checkedVisible < visible.length;
            count.textContent = `${ids.filter(id => planningEntries.has(id)).length} / ${ids.length}`;
        }
        const visible = visiblePlanningOptions();
        const checkedVisible = visible.filter(([id]) => planningEntries.has(id)).length;
        const all = $('plan-csb-all');
        all.checked = visible.length > 0 && checkedVisible === visible.length;
        all.indeterminate = checkedVisible > 0 && checkedVisible < visible.length;
        all.disabled = visible.length === 0;
        $('plan-csb-picker-count').textContent = `${planningEntries.size} / ${planningCsbs.length} CSB sélectionné(s)`;
        $('plan-csb-blocks-title').textContent = `2. Besoins par CSB (${planningEntries.size}) — besoin = ${PLANNING_CMM_MONTHS} × CMM − état de stock, ajustable · les lignes sans besoin ne sont pas enregistrées`;
        const toggle = $('planning-add');
        toggle.disabled = planningEntries.size === 0;
        toggle.textContent = [...planningEntries.values()].some(entry => entry.block.open) ? 'Tout replier' : 'Tout déplier';
    }

    function filterPlanningPicker() {
        const query = $('plan-csb-search').value.trim().toLocaleLowerCase('fr-FR');
        for (const option of planningOptions.values()) option.label.hidden = Boolean(query) && !option.search.includes(query);
        syncPlanningPicker();
    }

    // « Tous les CSB » agit sur les CSB visibles (tous, sauf si une recherche filtre la liste).
    function toggleAllPlanningCsbs() {
        setPlanningCsbs(visiblePlanningOptions().map(([id]) => id), $('plan-csb-all').checked);
    }

    // Ajoute ou retire un ensemble de CSB (tous, ou ceux d'un district) ; confirmation si des quantités seraient perdues.
    function setPlanningCsbs(ids, checked, scope = '') {
        if (checked) {
            ids.forEach(id => addPlanningCsb(id, null, false));
            renderPlanningBlocks();
            return;
        }
        const selected = ids.filter(id => planningEntries.has(id));
        const filled = selected.reduce((sum, id) => sum + planningFilled(planningEntries.get(id)), 0);
        if (filled && !confirm(`Retirer ces ${selected.length} CSB${scope ? ` ${scope}` : ''} de la campagne ? ${filled} quantité(s) saisie(s) seront perdues.`)) {
            syncPlanningPicker();
            return;
        }
        selected.forEach(id => planningEntries.delete(id));
        renderPlanningBlocks();
    }

    // Un CSB coché seul : on replie les autres et on ne déplie que lui.
    function openOnlyPlanningCsb(block) {
        if (!block) return null;
        for (const entry of planningEntries.values()) entry.block.open = entry.block === block;
        syncPlanningPicker();
        return block;
    }

    function togglePlanningBlocks() {
        const entries = [...planningEntries.values()];
        const open = !entries.some(entry => entry.block.open);
        entries.forEach(entry => { entry.block.open = open; });
        syncPlanningPicker();
    }

    // --- Onglet « Analyse stocks & CMM » (Planification) : historique des états de stock et CMM des CSB ---
    // Chaque enregistrement d'une campagne crée un instantané complet de ses évaluations ; l'évolution se lit
    // d'un instantané à l'autre, toutes campagnes confondues (actives et archivées).
    // Mois de stock (MSD) = état de stock ÷ CMM. Le besoin vise PLANNING_CMM_MONTHS mois ; sous ANALYSIS_MIN_MONTHS : sous-stock.
    // Les quantités ne sont additionnées que pour un même intrant ; la matrice compare les intrants par leur MSD (sans unité).
    const ANALYSIS_MIN_MONTHS = 2;
    const ANALYSIS_MAX_LINES = 8;
    const ANALYSIS_STATUS = {
        rupture: {label: 'Rupture', color: '#b91c1c', badge: 'bg-red-50 text-red-700 border-red-200', cell: 'bg-red-100 text-red-800'},
        under:   {label: `Sous-stock (< ${ANALYSIS_MIN_MONTHS} mois)`, color: '#d97706', badge: 'bg-amber-50 text-amber-800 border-amber-200', cell: 'bg-amber-100 text-amber-900'},
        ok:      {label: `Normal (${ANALYSIS_MIN_MONTHS} à ${PLANNING_CMM_MONTHS} mois)`, color: '#15803d', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', cell: 'bg-emerald-100 text-emerald-800'},
        over:    {label: `Surstock (> ${PLANNING_CMM_MONTHS} mois)`, color: '#7c3aed', badge: 'bg-violet-50 text-violet-700 border-violet-200', cell: 'bg-violet-100 text-violet-800'},
        nocmm:   {label: 'CMM nulle ou non saisie', color: '#64748b', badge: 'bg-slate-100 text-slate-600 border-slate-200', cell: 'bg-slate-100 text-slate-500'}
    };
    const ANALYSIS_LEVELS = {csb: 'CSB', district: 'District', region: 'Région'};
    const ANALYSIS_SERIES = ['#0284c7', '#d97706', '#059669', '#be185d', '#7c3aed', '#b91c1c', '#0f766e', '#475569'];
    const analysisPrefs = {level: 'csb', product: ''};
    let analysisState = null;
    let analysisCharts = [];

    function analysisStatus(stock, cmm) {
        if (cmm <= 0n) return 'nocmm';
        if (stock <= 0n) return 'rupture';
        if (stock < cmm * BigInt(ANALYSIS_MIN_MONTHS)) return 'under';
        if (stock > cmm * BigInt(PLANNING_CMM_MONTHS)) return 'over';
        return 'ok';
    }

    const analysisMonths = (stock, cmm) => cmm > 0n ? Number(stock * 100n / cmm) / 100 : null;
    const formatMonths = value => value === null ? '—' : value.toLocaleString('fr-FR', {maximumFractionDigits: 1});
    const analysisDate = value => new Date(value).toLocaleDateString('fr-FR', {timeZone: 'Indian/Antananarivo'});

    function analysisGroupKey(row, level) {
        if (level === 'csb') return {key: row.csb_id, label: row.csb_name};
        const value = level === 'district' ? row.district : row.region;
        const label = value || (level === 'district' ? 'District non renseigné' : 'Région non renseignée');
        return {key: label, label};
    }

    // Agrège les évaluations d'un intrant par niveau géographique (lignes d'un même instantané).
    function analysisGroups(rows, level, productId) {
        const groups = new Map();
        for (const row of rows) {
            if (productId && row.product_id !== productId) continue;
            const {key, label} = analysisGroupKey(row, level);
            if (!groups.has(key)) groups.set(key, {key, label, csbs: new Set(), ruptures: new Set(), stock: 0n, cmm: 0n, need: 0n, district: row.district});
            const group = groups.get(key);
            const stock = BigInt(row.stock_level ?? 0), cmm = BigInt(row.cmm ?? 0);
            group.csbs.add(row.csb_id);
            if (analysisStatus(stock, cmm) === 'rupture') group.ruptures.add(row.csb_id);
            group.stock += stock;
            group.cmm += cmm;
            const target = cmm * BigInt(PLANNING_CMM_MONTHS) - stock;
            if (target > 0n) group.need += target;
        }
        return [...groups.values()].map(group => ({...group, months: analysisMonths(group.stock, group.cmm), status: analysisStatus(group.stock, group.cmm)}))
            .sort((a, b) => (a.months ?? Infinity) - (b.months ?? Infinity) || a.label.localeCompare(b.label, 'fr'));
    }

    // Instantanés ordonnés dans le temps ; plusieurs enregistrements le même jour pour une même campagne
    // sont réduits au dernier, pour garder des courbes lisibles.
    function analysisSnapshots(rows) {
        const snapshots = new Map();
        for (const row of rows) {
            if (!snapshots.has(row.snapshot_id)) snapshots.set(row.snapshot_id, {id: row.snapshot_id, recordedAt: row.recorded_at,
                planningId: row.planning_id, code: row.planning_code, status: row.planning_status, rows: []});
            snapshots.get(row.snapshot_id).rows.push(row);
        }
        const daily = new Map();
        for (const snapshot of [...snapshots.values()].sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)))) {
            daily.set(`${snapshot.planningId}:${analysisDate(snapshot.recordedAt)}`, snapshot);
        }
        return [...daily.values()].sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)))
            .map(snapshot => ({...snapshot, label: `${analysisDate(snapshot.recordedAt)} · ${snapshot.code}`}));
    }

    function analysisBadge(status, text = ANALYSIS_STATUS[status].label) {
        return planningCell('span', text, `inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${ANALYSIS_STATUS[status].badge}`);
    }

    function destroyAnalysisCharts() {
        analysisCharts.forEach(chart => { try { chart.destroy(); } catch { /* déjà détruit */ } });
        analysisCharts = [];
    }

    function clearStockAnalysis() {
        destroyAnalysisCharts();
        analysisState = null;
        $('stock-analysis-content').replaceChildren();
    }

    async function refreshStockAnalysis() {
        const port = portSelect.value, seq = ++requestSequence, requestGeneration = sessionGeneration;
        const status = $('postgres-stock-analysis-status');
        clearStockAnalysis();
        status.textContent = port ? 'Chargement de l’historique…' : 'Aucun magasin disponible.';
        if (!port) return;
        try {
            const rows = await api('/rest/v1/rpc/qbox_planning_assessment_history', {selected_port: port}, true);
            if (seq !== requestSequence || activeView !== 'stock-analysis' || port !== portSelect.value || sessionGeneration !== requestGeneration) return;
            const snapshots = analysisSnapshots(rows);
            analysisState = {snapshots, level: analysisPrefs.level, product: analysisPrefs.product};
            const latest = snapshots.at(-1);
            if (latest && !latest.rows.some(row => row.product_id === analysisState.product)) analysisState.product = latest.rows[0]?.product_id || '';
            renderStockAnalysis();
            status.textContent = `${snapshots.length} relevé(s) sur ${new Set(snapshots.map(snapshot => snapshot.planningId)).size} campagne(s) · Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (seq === requestSequence && activeView === 'stock-analysis' && port === portSelect.value && sessionGeneration === requestGeneration)
                status.textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    function analysisSelect(label, options, value, onChange) {
        const wrapper = planningCell('label', '', 'sa-field');
        wrapper.append(planningCell('span', label, 'sa-field-label'));
        const select = document.createElement('select');
        select.className = 'sa-select';
        for (const [optionValue, text] of options) select.add(new Option(text, optionValue));
        select.value = value;
        select.addEventListener('change', () => onChange(select.value));
        wrapper.append(select);
        return wrapper;
    }

    // tone : primary, teal, accent, violet ou une clé d'ANALYSIS_STATUS (couleur du statut).
    function analysisKpi(label, value, hint = '', tone = 'primary', icon = '') {
        const tile = planningCell('div', '', `planning-analysis-kpi sa-kpi sa-tone-${tone}`);
        if (icon) {
            const badge = planningCell('span', '', 'sa-kpi-icon');
            const glyph = planningCell('i', '', `ph ${icon}`);
            glyph.setAttribute('aria-hidden', 'true');
            badge.append(glyph);
            tile.append(badge);
        }
        const text = planningCell('div', '', 'sa-kpi-text');
        text.append(planningCell('div', label, 'sa-kpi-label'), planningCell('div', value, 'sa-kpi-value'));
        if (hint) text.append(planningCell('div', hint, 'sa-kpi-hint'));
        tile.append(text);
        return tile;
    }

    // Répartition des CSB par statut au dernier relevé (barre empilée + légende chiffrée).
    function analysisDistribution(groups) {
        const box = planningCell('div', '', 'sa-card sa-distribution');
        const head = planningCell('div', '', 'sa-card-head');
        head.append(planningCell('h4', 'Répartition des CSB par statut', 'sa-card-title'), planningCell('span', `${groups.length} CSB évalué(s)`, 'sa-card-note'));
        const bar = planningCell('div', '', 'sa-bar');
        bar.setAttribute('aria-hidden', 'true');
        const legend = planningCell('div', '', 'sa-bar-legend');
        for (const key of ['rupture', 'under', 'ok', 'over', 'nocmm']) {
            const count = groups.filter(group => group.status === key).length;
            if (!count) continue;
            const segment = planningCell('span', '', `sa-bar-segment sa-status-${key}`);
            segment.style.width = `${count * 100 / groups.length}%`;
            segment.title = `${ANALYSIS_STATUS[key].label} : ${count} CSB`;
            bar.append(segment);
            const item = planningCell('span', '', `sa-legend-item sa-status-${key}`);
            item.append(planningCell('strong', String(count)), planningCell('span', ANALYSIS_STATUS[key].label));
            legend.append(item);
        }
        box.append(head, bar, legend);
        return box;
    }

    // Jauge des mois de stock : échelle de 0 à cible + 2 mois, repères au minimum et à la cible.
    function analysisGauge(months, status) {
        const scale = PLANNING_CMM_MONTHS + 2;
        const gauge = planningCell('span', '', `sa-gauge sa-status-${status}`);
        gauge.setAttribute('aria-hidden', 'true');
        const fill = planningCell('span', '', 'sa-gauge-fill');
        fill.style.width = `${months === null ? 0 : Math.min(1, months / scale) * 100}%`;
        gauge.append(fill);
        for (const mark of [ANALYSIS_MIN_MONTHS, PLANNING_CMM_MONTHS]) {
            const tick = planningCell('span', '', 'sa-gauge-mark');
            tick.style.left = `${mark * 100 / scale}%`;
            gauge.append(tick);
        }
        return gauge;
    }

    // Couleurs des axes lues dans le thème (clair ou sombre), avec des valeurs de secours.
    function analysisChartTheme() {
        let style = null;
        try { style = typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement) : null; } catch { style = null; }
        const read = (name, fallback) => (style?.getPropertyValue?.(name) || '').trim() || fallback;
        return {text: read('--qb-muted', '#475569'), grid: read('--qb-line-soft', '#e2e8f0')};
    }

    function analysisChartBox(title, height, description) {
        const box = planningCell('div', '', 'sa-card sa-chart');
        box.append(planningCell('h5', title, 'sa-card-title'));
        if (description) box.append(planningCell('p', description, 'sa-card-note'));
        const holder = planningCell('div', '', 'sa-chart-holder');
        holder.style.height = `${height}px`;
        const canvas = document.createElement('canvas');
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `${title}. Le détail figure dans les tableaux de l’onglet.`);
        holder.append(canvas);
        box.append(holder);
        return {box, canvas};
    }

    // Lignes horizontales des seuils de mois de stock sur les courbes.
    const analysisThresholdPlugin = {
        id: 'qbAnalysisThresholds',
        afterDatasetsDraw(chart) {
            const scale = chart.scales?.y, area = chart.chartArea, ctx = chart.ctx;
            if (!scale || !area || !ctx) return;
            for (const [value, color, text] of [[ANALYSIS_MIN_MONTHS, '#d97706', `min ${ANALYSIS_MIN_MONTHS} mois`],
                [PLANNING_CMM_MONTHS, '#7c3aed', `cible ${PLANNING_CMM_MONTHS} mois`]]) {
                const y = scale.getPixelForValue(value);
                if (y < area.top || y > area.bottom) continue;
                ctx.save();
                ctx.strokeStyle = color;
                ctx.setLineDash([5, 4]);
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(area.left, y);
                ctx.lineTo(area.right, y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = color;
                ctx.font = '600 10px Inter, sans-serif';
                ctx.fillText(text, area.right - 70, y - 4);
                ctx.restore();
            }
        }
    };

    function renderAnalysisCharts({snapshots, series, totals, statusSeries, maxMonths}, boxes) {
        destroyAnalysisCharts();
        if (typeof window.Chart !== 'function') return false;
        const theme = analysisChartTheme();
        const axis = {ticks: {color: theme.text, font: {size: 10}}, grid: {color: theme.grid}};
        const labels = snapshots.map(snapshot => snapshot.label);
        const legend = {position: 'bottom', labels: {color: theme.text, boxWidth: 12, font: {size: 10}}};
        try {
            analysisCharts.push(new window.Chart(boxes.months.canvas, {
                type: 'line',
                data: {labels, datasets: series.map((line, index) => ({
                    label: line.label, data: line.values.map(value => value === null ? null : Math.min(value, maxMonths)),
                    borderColor: ANALYSIS_SERIES[index % ANALYSIS_SERIES.length], backgroundColor: ANALYSIS_SERIES[index % ANALYSIS_SERIES.length],
                    spanGaps: true, tension: 0.2, borderWidth: 2.5,
                    // Points rouges et agrandis sur les relevés en rupture.
                    pointRadius: line.statuses.map(status => status === 'rupture' ? 6 : 3),
                    pointBackgroundColor: line.statuses.map(status => status === 'rupture' ? '#b91c1c' : ANALYSIS_SERIES[index % ANALYSIS_SERIES.length])
                }))},
                options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend,
                    tooltip: {callbacks: {label: item => {
                        const line = series[item.datasetIndex], value = line.values[item.dataIndex];
                        return `${line.label} : ${formatMonths(value)} mois · ${ANALYSIS_STATUS[line.statuses[item.dataIndex]]?.label || ''}`;
                    }}}},
                    scales: {x: {...axis, ticks: {...axis.ticks, maxRotation: 45}}, y: {...axis, min: 0, max: maxMonths,
                        title: {display: true, text: 'Mois de stock', color: theme.text}}}},
                plugins: [analysisThresholdPlugin]
            }));
            analysisCharts.push(new window.Chart(boxes.quantities.canvas, {
                type: 'bar',
                data: {labels, datasets: [
                    {type: 'bar', label: 'État de stock', data: totals.map(total => Number(total.stock)), backgroundColor: '#0284c7', borderRadius: 4, maxBarThickness: 28, order: 2},
                    {type: 'line', label: 'CMM', data: totals.map(total => Number(total.cmm)), borderColor: '#0f766e', backgroundColor: '#0f766e', tension: 0.2, borderWidth: 2.5, order: 1},
                    {type: 'line', label: `Cible ${PLANNING_CMM_MONTHS} mois (${PLANNING_CMM_MONTHS} × CMM)`, data: totals.map(total => Number(total.cmm) * PLANNING_CMM_MONTHS),
                        borderColor: '#7c3aed', backgroundColor: '#7c3aed', borderDash: [6, 4], pointRadius: 0, borderWidth: 1.5, order: 0}
                ]},
                options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend},
                    scales: {x: {...axis, ticks: {...axis.ticks, maxRotation: 45}}, y: {...axis, beginAtZero: true}}}
            }));
            const statuses = Object.keys(ANALYSIS_STATUS).filter(key => statusSeries.some(point => point[key]));
            analysisCharts.push(new window.Chart(boxes.statuses.canvas, {
                type: 'bar',
                data: {labels, datasets: statuses.map(key => ({label: ANALYSIS_STATUS[key].label, data: statusSeries.map(point => point[key] || 0),
                    backgroundColor: ANALYSIS_STATUS[key].color, borderRadius: 3, maxBarThickness: 32}))},
                options: {responsive: true, maintainAspectRatio: false, animation: false, plugins: {legend},
                    scales: {x: {...axis, stacked: true, ticks: {...axis.ticks, maxRotation: 45}}, y: {...axis, stacked: true, beginAtZero: true,
                        ticks: {...axis.ticks, precision: 0}, title: {display: true, text: 'Nombre de CSB', color: theme.text}}}}
            }));
            return true;
        } catch (error) {
            destroyAnalysisCharts();
            return false;
        }
    }

    function analysisTrend(current, previous) {
        if (current === null || previous === null || previous === undefined) return planningCell('span', '—', 'text-slate-400');
        const delta = Math.round((current - previous) * 10) / 10;
        if (delta === 0) return planningCell('span', '= stable', 'text-slate-500 font-semibold');
        return planningCell('span', `${delta > 0 ? '▲ +' : '▼ −'}${formatMonths(Math.abs(delta))} mois`, `font-semibold ${delta > 0 ? 'text-emerald-700' : 'text-red-600'}`);
    }

    function analysisDetailTable(groups, level, previous, ruptureCounts) {
        const table = planningCell('table', '', 'sa-table');
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        const columns = [ANALYSIS_LEVELS[level], level === 'csb' ? 'District' : 'CSB', 'État de stock', 'CMM', 'Mois de stock', 'Évolution',
            `Besoin (${PLANNING_CMM_MONTHS} × CMM − stock)`, 'Statut actuel'];
        columns.forEach((text, index) => header.append(planningCell('th', text, [2, 3, 6].includes(index) ? 'sa-th sa-right' : 'sa-th')));
        head.append(header);
        const body = document.createElement('tbody');
        for (const group of groups) {
            const row = planningCell('tr', '', `sa-row sa-status-${group.status}`);
            const name = planningCell('th', group.label, 'sa-name');
            name.scope = 'row';
            const trend = planningCell('td', '', 'sa-cell');
            trend.append(analysisTrend(group.months, previous.get(group.key)?.months));
            const status = planningCell('td', '', 'sa-cell sa-badges');
            status.append(analysisBadge(group.status));
            if (level !== 'csb' && group.ruptures.size) status.append(analysisBadge('rupture', `${group.ruptures.size} CSB en rupture`));
            const past = ruptureCounts.get(group.key) || 0;
            if (past > (group.status === 'rupture' ? 1 : 0)) status.append(analysisBadge('rupture', `${past} relevé(s) en rupture`));
            const months = planningCell('td', '', 'sa-cell sa-months');
            months.append(planningCell('span', formatMonths(group.months), 'sa-months-value'), analysisGauge(group.months, group.status));
            row.append(name, planningCell('td', level === 'csb' ? (group.district || '—') : String(group.csbs.size), level === 'csb' ? 'sa-cell sa-muted' : 'sa-num'),
                planningCell('td', number(group.stock), 'sa-num'), planningCell('td', number(group.cmm), 'sa-num'),
                months, trend, planningCell('td', number(group.need), group.need > 0n ? 'sa-num sa-need' : 'sa-num'), status);
            body.append(row);
        }
        table.append(head, body);
        const scroll = planningCell('div', '', 'sa-scroll');
        scroll.append(table);
        return scroll;
    }

    // Matrice groupe × intrant (dernier relevé) : mois de stock colorés selon le statut.
    function analysisMatrix(rows, level) {
        const products = [...new Map(rows.map(row => [row.product_id, row.product_name])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
        const byProduct = new Map(products.map(([id]) => [id, new Map(analysisGroups(rows, level, id).map(group => [group.key, group]))]));
        const groups = [...new Map(rows.map(row => { const key = analysisGroupKey(row, level); return [key.key, key.label]; })).entries()]
            .sort((a, b) => a[1].localeCompare(b[1], 'fr'));
        const table = planningCell('table', '', 'planning-analysis-matrix sa-matrix');
        const head = document.createElement('thead');
        const header = document.createElement('tr');
        header.append(planningCell('th', ANALYSIS_LEVELS[level], 'sa-th sa-sticky'));
        for (const [, name] of products) header.append(planningCell('th', name, 'sa-th sa-center'));
        head.append(header);
        const body = document.createElement('tbody');
        for (const [key, label] of groups) {
            const row = document.createElement('tr');
            const name = planningCell('th', label, 'sa-name sa-sticky');
            name.scope = 'row';
            row.append(name);
            for (const [productId] of products) {
                const group = byProduct.get(productId).get(key);
                const cell = planningCell('td', '', 'sa-cell sa-center');
                if (group) {
                    const chip = planningCell('span', group.status === 'rupture' ? 'Rupture' : group.months === null ? 'CMM 0' : `${formatMonths(group.months)} m`,
                        `sa-chip sa-status-${group.status}`);
                    chip.title = `${label} · ${ANALYSIS_STATUS[group.status].label} · stock ${number(group.stock)} / CMM ${number(group.cmm)}`;
                    cell.append(chip);
                }
                row.append(cell);
            }
            body.append(row);
        }
        table.append(head, body);
        const scroll = planningCell('div', '', 'sa-scroll');
        scroll.append(table);
        return scroll;
    }

    // Bandeau des ruptures du dernier relevé, tous intrants confondus, regroupées par district.
    function analysisRuptureAlert(latest) {
        const ruptures = latest.rows.filter(row => analysisStatus(BigInt(row.stock_level ?? 0), BigInt(row.cmm ?? 0)) === 'rupture');
        const box = planningCell('div', '', `planning-analysis-ruptures sa-alert ${ruptures.length ? 'sa-alert-danger' : 'sa-alert-ok'}`);
        const badge = planningCell('span', '', 'sa-alert-icon');
        const icon = planningCell('i', '', `ph ${ruptures.length ? 'ph-warning-octagon' : 'ph-check-circle'}`);
        icon.setAttribute('aria-hidden', 'true');
        badge.append(icon);
        const body = planningCell('div', '', 'sa-alert-body');
        body.append(planningCell('strong', ruptures.length
            ? `${ruptures.length} rupture(s) au dernier relevé (${latest.label})`
            : `Aucune rupture au dernier relevé (${latest.label})`, 'sa-alert-title'),
            planningCell('span', ruptures.length ? 'Stock nul avec une consommation : à réapprovisionner en priorité.' : 'Tous les CSB évalués ont du stock pour leurs intrants consommés.', 'sa-alert-text'));
        if (ruptures.length) {
            const districts = new Map();
            for (const row of ruptures) {
                const district = row.district || NO_DISTRICT;
                if (!districts.has(district)) districts.set(district, []);
                districts.get(district).push(row);
            }
            const list = planningCell('div', '', 'sa-alert-groups');
            for (const district of [...districts.keys()].sort((a, b) => a === NO_DISTRICT ? 1 : b === NO_DISTRICT ? -1 : a.localeCompare(b, 'fr'))) {
                const group = planningCell('div', '', 'sa-alert-group');
                group.append(planningCell('span', district, 'sa-alert-district'));
                for (const row of districts.get(district)) {
                    const chip = analysisBadge('rupture', `${row.csb_name} · ${row.product_name}`);
                    chip.title = `${district} · ${row.region || 'Région non renseignée'} · CMM ${number(row.cmm ?? 0)} ${row.unit || ''}`;
                    group.append(chip);
                }
                list.append(group);
            }
            body.append(list);
        }
        box.append(badge, body);
        return box;
    }

    function renderStockAnalysis() {
        const state = analysisState, container = $('stock-analysis-content');
        if (!state) return;
        destroyAnalysisCharts();
        const latest = state.snapshots.at(-1);
        if (!latest) {
            container.replaceChildren(planningCell('p', 'Aucun état de stock ni CMM enregistré pour ce magasin. Renseignez-les dans le formulaire d’une campagne (Besoins prévisionnels) : chaque enregistrement ajoute un relevé à cet historique.',
                'sa-empty'));
            return;
        }
        const allRows = state.snapshots.flatMap(snapshot => snapshot.rows);
        const products = [...new Map(allRows.map(row => [row.product_id, row.product_name])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr'));
        if (!products.some(([id]) => id === state.product)) state.product = products[0][0];
        const currentRuptures = new Map();
        for (const row of latest.rows) if (analysisStatus(BigInt(row.stock_level ?? 0), BigInt(row.cmm ?? 0)) === 'rupture')
            currentRuptures.set(row.product_id, (currentRuptures.get(row.product_id) || 0) + 1);
        // Réglages
        const controls = planningCell('div', '', 'sa-card sa-toolbar');
        const fields = planningCell('div', '', 'sa-fields');
        fields.append(analysisSelect('Intrant', products.map(([id, name]) => [id, currentRuptures.get(id) ? `${name} · ⚠ ${currentRuptures.get(id)} rupture(s)` : name]), state.product,
            value => { state.product = analysisPrefs.product = value; renderStockAnalysis(); }));
        const levels = planningCell('div', '', 'sa-field');
        levels.append(planningCell('span', 'Niveau', 'sa-field-label'));
        const toggle = planningCell('div', '', 'sa-segmented');
        toggle.setAttribute('role', 'group');
        toggle.setAttribute('aria-label', 'Niveau d’analyse');
        for (const [key, label] of Object.entries(ANALYSIS_LEVELS)) {
            const button = planningCell('button', label, state.level === key ? 'sa-segment is-active' : 'sa-segment');
            button.type = 'button';
            button.setAttribute('aria-pressed', String(state.level === key));
            button.addEventListener('click', () => { state.level = analysisPrefs.level = key; renderStockAnalysis(); });
            toggle.append(button);
        }
        levels.append(toggle);
        fields.append(levels);
        // Légende des statuts (seuils en mois de stock) et période couverte.
        const info = planningCell('div', '', 'sa-toolbar-info');
        const legend = planningCell('div', '', 'sa-legend');
        for (const key of ['rupture', 'under', 'ok', 'over', 'nocmm'])
            legend.append(planningCell('span', ANALYSIS_STATUS[key].label, `sa-legend-item sa-status-${key}`));
        info.append(legend, planningCell('p', `Mois de stock = état de stock ÷ CMM · ${state.snapshots.length} relevé(s) du ${analysisDate(state.snapshots[0].recordedAt)} au ${analysisDate(latest.recordedAt)}`, 'sa-card-note'));
        controls.append(fields, info);
        // Situation au dernier relevé pour l'intrant choisi
        const productName = products.find(([id]) => id === state.product)[1];
        const unit = allRows.find(row => row.product_id === state.product)?.unit || 'unités';
        const latestCsbs = analysisGroups(latest.rows, 'csb', state.product);
        const totals = latestCsbs.reduce((sum, group) => ({stock: sum.stock + group.stock, cmm: sum.cmm + group.cmm, need: sum.need + group.need}), {stock: 0n, cmm: 0n, need: 0n});
        const months = analysisMonths(totals.stock, totals.cmm);
        const ruptureCount = latestCsbs.filter(group => group.status === 'rupture').length;
        const totalStatus = analysisStatus(totals.stock, totals.cmm);
        const kpis = planningCell('div', '', 'sa-kpis');
        kpis.append(analysisKpi('CSB évalués', String(latestCsbs.length), `${productName} · ${latest.label}`, 'primary', 'ph-first-aid-kit'),
            analysisKpi('CSB en rupture', String(ruptureCount), ruptureCount ? 'Stock nul avec une consommation' : 'Aucune rupture',
                ruptureCount ? 'rupture' : 'ok', ruptureCount ? 'ph-warning-octagon' : 'ph-check-circle'),
            analysisKpi('État de stock total', number(totals.stock), unit, 'teal', 'ph-package'),
            analysisKpi('Mois de stock', formatMonths(months), months === null ? 'CMM nulle' : ANALYSIS_STATUS[totalStatus].label, totalStatus, 'ph-calendar-blank'),
            analysisKpi(`Besoin ${PLANNING_CMM_MONTHS} mois`, number(totals.need), `${unit} à couvrir`, 'accent', 'ph-shopping-cart'));
        // Séries dans le temps
        const perSnapshot = state.snapshots.map(snapshot => new Map(analysisGroups(snapshot.rows, state.level, state.product).map(group => [group.key, group])));
        const latestGroups = analysisGroups(latest.rows, state.level, state.product);
        const labelsByKey = new Map(perSnapshot.flatMap(groups => [...groups.values()].map(group => [group.key, group.label])));
        const ordered = [...latestGroups.map(group => group.key), ...[...labelsByKey.keys()].filter(key => !latestGroups.some(group => group.key === key))];
        const shown = ordered.slice(0, ANALYSIS_MAX_LINES);
        const series = shown.map(key => ({key, label: labelsByKey.get(key),
            values: perSnapshot.map(groups => groups.get(key)?.months ?? null),
            statuses: perSnapshot.map(groups => groups.get(key)?.status || null)}));
        const maxMonths = Math.max(PLANNING_CMM_MONTHS + 2, Math.min(12, Math.ceil(Math.max(0, ...series.flatMap(line => line.values.filter(value => value !== null))))));
        const totalsSeries = state.snapshots.map(snapshot => analysisGroups(snapshot.rows, 'csb', state.product)
            .reduce((sum, group) => ({stock: sum.stock + group.stock, cmm: sum.cmm + group.cmm}), {stock: 0n, cmm: 0n}));
        const statusSeries = state.snapshots.map(snapshot => {
            const counts = {};
            for (const group of analysisGroups(snapshot.rows, 'csb', state.product)) counts[group.status] = (counts[group.status] || 0) + 1;
            return counts;
        });
        const levelLabel = ANALYSIS_LEVELS[state.level].toLowerCase();
        const boxes = {
            months: analysisChartBox(`Évolution des mois de stock par ${levelLabel} · ${productName}`, 300,
                `Un point par relevé (enregistrement d’une campagne). Points rouges : rupture. Lignes pointillées : minimum ${ANALYSIS_MIN_MONTHS} mois et cible ${PLANNING_CMM_MONTHS} mois.`
                + (ordered.length > ANALYSIS_MAX_LINES ? ` Les ${ANALYSIS_MAX_LINES} ${levelLabel}s les plus critiques sur ${ordered.length} sont tracés ; le tableau les liste tous.` : '')),
            quantities: analysisChartBox(`État de stock et CMM dans le temps · ${productName}`, 260, `Totaux du magasin en ${unit}.`),
            statuses: analysisChartBox(`CSB par statut dans le temps · ${productName}`, 260, 'Les ruptures apparaissent en rouge.')
        };
        const chartsMessage = planningCell('p', 'Graphiques indisponibles (Chart.js non chargé) : les tableaux ci-dessous restent complets.', 'planning-analysis-charts-message sa-charts-message');
        chartsMessage.hidden = true;
        const lower = planningCell('div', '', 'sa-chart-pair');
        lower.append(boxes.quantities.box, boxes.statuses.box);
        // Tableaux : situation actuelle avec évolution depuis le relevé précédent, puis matrice.
        const previous = perSnapshot.length > 1 ? perSnapshot.at(-2) : new Map();
        const ruptureCounts = new Map();
        for (const groups of perSnapshot) for (const group of groups.values()) if (group.status === 'rupture') ruptureCounts.set(group.key, (ruptureCounts.get(group.key) || 0) + 1);
        const detail = planningCell('div', '', 'sa-card sa-section');
        detail.append(planningCell('h4', `Situation au dernier relevé par ${levelLabel} · ${productName}`, 'sa-card-title'),
            planningCell('p', `Du plus critique au mieux couvert. Jauge : repères à ${ANALYSIS_MIN_MONTHS} mois (minimum) et ${PLANNING_CMM_MONTHS} mois (cible). Évolution : écart avec le relevé précédent.`, 'sa-card-note'),
            analysisDetailTable(latestGroups, state.level, previous, ruptureCounts));
        const matrix = planningCell('div', '', 'sa-card sa-section');
        matrix.append(planningCell('h4', `Mois de stock par ${levelLabel} et par intrant · ${latest.label}`, 'sa-card-title'),
            planningCell('p', 'Chaque intrant est comparé à sa propre CMM : la matrice compare les intrants entre eux.', 'sa-card-note'),
            analysisMatrix(latest.rows, state.level));
        container.replaceChildren(analysisRuptureAlert(latest), controls, kpis, analysisDistribution(latestCsbs), chartsMessage, boxes.months.box, lower, detail, matrix);
        // Graphiques créés une fois les canevas dans la page, pour que Chart.js puisse les dimensionner.
        if (!renderAnalysisCharts({snapshots: state.snapshots, series, totals: totalsSeries, statusSeries, maxMonths}, boxes)) {
            for (const box of [boxes.months.box, lower]) box.hidden = true;
            chartsMessage.hidden = false;
        }
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
            resetPlanningForm();
            renderPlanningPicker();
            if (plan) {
                // Lignes du planning + évaluations enregistrées (y compris les lignes à besoin nul).
                const assessments = await api('/rest/v1/rpc/qbox_planning_assessments', {selected_port: port, selected_planning: plan.id}, true);
                if (sessionGeneration !== requestGeneration || sequence !== requestSequence || activeView !== 'planning' || port !== portSelect.value) return;
                const grouped = new Map();
                const lineFor = (csbId, productId) => {
                    if (!grouped.has(csbId)) grouped.set(csbId, new Map());
                    const lines = grouped.get(csbId);
                    if (!lines.has(productId)) lines.set(productId, {product_id: productId, planned: '', stock_level: null, cmm: null});
                    return lines.get(productId);
                };
                for (const item of plan.items) lineFor(item.csb_id, item.product_id).planned = item.planned;
                for (const row of assessments) {
                    if (!csbs.some(csb => csb.id === row.csb_id) || !products.some(product => product.id === row.product_id)) continue;
                    Object.assign(lineFor(row.csb_id, row.product_id), {stock_level: row.stock_level, cmm: row.cmm});
                }
                for (const [csbId, lines] of grouped) addPlanningCsb(csbId, [...lines.values()], false);
            }
            renderPlanningBlocks();
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
        resetPlanningForm();
        $('modal-planning').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    async function submitPlanning(event) {
        event.preventDefault();
        if (!planningDraft || planningSaving || !hasRole(['admin', 'logistics'])) return;
        const draft = planningDraft;
        const blocks = [...$('plan-csb-blocks').querySelectorAll('.planning-csb')];
        const status = $('postgres-plan-form-status');
        const start = $('plan-start').value, end = $('plan-end').value;
        if (draft.port !== portSelect.value || !start || !end || start > end) {
            status.textContent = 'Vérifiez le port et les dates de la campagne.';
            return;
        }
        if (!blocks.length) {
            status.textContent = 'Sélectionnez au moins un CSB.';
            return;
        }
        // Une ligne est enregistrée si elle a un besoin, ou une évaluation (état de stock / CMM) :
        // dans ce dernier cas elle part avec une quantité 0 et sert à l'analyse sans créer de besoin à livrer.
        const rows = [], emptyCsbs = [];
        let invalid = false;
        const whole = input => {
            if (!input) return null;
            if (input.validity?.badInput) invalid = true;
            const raw = String(input.value ?? '').trim();
            if (raw === '') return null;
            const value = Number(raw);
            if (!Number.isSafeInteger(value) || value < 0) invalid = true;
            return value;
        };
        for (const block of blocks) {
            const csbId = block.querySelector('[name=csb]').value;
            let kept = 0;
            for (const row of block.querySelectorAll('.planning-item')) {
                const quantity = whole(row.querySelector('[name=quantity]'));
                const stockLevel = whole(row.querySelector('[name=stock_level]'));
                const cmm = whole(row.querySelector('[name=cmm]'));
                if (!quantity && stockLevel === null && cmm === null) continue;
                kept++;
                rows.push({csb_id: csbId, product_id: row.querySelector('[name=product]').value,
                    quantity: quantity ?? 0, stock_level: stockLevel, cmm});
            }
            if (!kept) emptyCsbs.push(planningCsbs.find(csb => csb.id === csbId)?.name || 'CSB sans nom');
        }
        if (invalid || rows.some(row => !row.csb_id || !row.product_id || !Number.isSafeInteger(row.quantity) || row.quantity < 0)) {
            status.textContent = 'Les besoins, états de stock et CMM doivent être des nombres entiers positifs ou nuls.';
            return;
        }
        if (emptyCsbs.length) {
            status.textContent = `Renseignez au moins une quantité ou retirez ces CSB : ${emptyCsbs.join(', ')}.`;
            return;
        }
        const plannedLines = rows.filter(row => row.quantity > 0).length;
        if (!plannedLines) {
            status.textContent = 'Aucun besoin à livrer : au moins une ligne doit avoir un besoin supérieur à 0.';
            return;
        }
        if (plannedLines > 500 || rows.length > 2000) {
            status.textContent = `Un planning est limité à 500 lignes avec besoin et 2000 lignes au total (actuellement ${plannedLines} et ${rows.length}).`;
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
                if (planningDraft) { planningEntries.forEach(updatePlanningBlock); syncPlanningPicker(); }
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

    // --- Circuit de validation des plannings (Chef de l'Unité Santé de la Reproduction, rôle rh_chief) ---
    // Le coordinateur (ou le pilote RD) soumet ; le Chef Unité SR ajuste les quantités puis valide, ou renvoie
    // avec un motif. Les contrôles de droits, d'état et de quantités sont faits par le serveur.
    const PLANNING_VALIDATION = {
        draft:     {label: 'En préparation', icon: 'ph-pencil-simple-line'},
        submitted: {label: 'En attente de validation', icon: 'ph-hourglass-medium'},
        validated: {label: 'Validé', icon: 'ph-seal-check'},
        returned:  {label: 'À revoir', icon: 'ph-arrow-u-up-left'}
    };
    // Plannings antérieurs au circuit (ou réponse sans état) : considérés comme validés.
    const planningValidationState = plan => PLANNING_VALIDATION[plan?.validation_status] ? plan.validation_status : 'validated';

    let validationDraft = null;
    let validationSaving = false;

    // Avertissement des formulaires de vol et d'expédition : la livraison reste possible (urgences).
    function planningValidationWarning(plan) {
        if (!plan) return '';
        const state = planningValidationState(plan);
        if (state === 'validated') return '';
        const reason = state === 'submitted' ? 'est en attente de validation' : state === 'returned' ? 'a été renvoyé pour correction' : 'n’est pas encore validé';
        return `Le planning ${plan.code} ${reason} par le Chef Unité SR. La livraison reste possible (urgence, rupture d’un CSB), mais les quantités peuvent encore changer.`;
    }

    function showPlanningValidationWarning(id, plan) {
        const element = $(id);
        const text = planningValidationWarning(plan);
        element.textContent = text;
        element.hidden = !text;
    }

    function validationButton(label, className, icon, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.dataset.icon = icon;
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    // Badge, mention et actions du circuit sur la carte d'une campagne. Renvoie le bandeau du motif de renvoi éventuel.
    function appendPlanningValidation(plan, view, meta, actions) {
        const state = planningValidationState(plan);
        const info = PLANNING_VALIDATION[state];
        const badge = planningCell('span', '', `pc-validation pc-validation-${state}`);
        badge.append(planningIcon(info.icon), planningCell('span', info.label));
        actions.append(badge);
        if (state === 'validated' && plan.validated_at)
            meta.append(planningCell('span', `Validé par ${plan.validated_by_name || 'le Chef Unité SR'} le ${localDateTime(plan.validated_at)}`, 'pc-meta-item'));
        else if (state === 'submitted' && plan.submitted_at)
            meta.append(planningCell('span', `Soumis par ${plan.submitted_by_name || 'nom non renseigné'} le ${localDateTime(plan.submitted_at)}`, 'pc-meta-item'));
        if (view !== 'planning') return null;
        if (['draft', 'returned'].includes(state) && hasRole(['admin', 'logistics']))
            actions.append(validationButton('Soumettre pour validation', 'pc-button pc-button-submit', 'send', () => submitPlanningForValidation(plan)));
        if (state === 'submitted' && hasRole(['admin', 'rh_chief']))
            actions.append(validationButton('Valider le planning', 'pc-button pc-button-validate', 'check', () => openPlanningValidation(plan.id)));
        if (state !== 'returned' || !plan.review_comment) return null;
        const review = planningCell('div', '', 'pc-review');
        review.append(planningIcon('ph-arrow-u-up-left'), planningCell('strong', 'Renvoyé pour correction :'), planningCell('span', plan.review_comment));
        return review;
    }

    async function submitPlanningForValidation(plan) {
        if (validationSaving || !portSelect.value || !hasRole(['admin', 'logistics'])) return;
        if (!confirm(`Soumettre le planning ${plan.code} au Chef Unité SR pour validation ?\n\nIl sera prévenu par e-mail. Le planning ne pourra plus être modifié tant qu’il n’est pas validé ou renvoyé.`)) return;
        const port = portSelect.value, requestGeneration = sessionGeneration;
        validationSaving = true;
        $('postgres-planning-status').textContent = 'Soumission du planning…';
        try {
            await api('/rest/v1/rpc/qbox_submit_planning', {selected_port: port, selected_planning: plan.id, expected_version: plan.version}, true);
            if (requestGeneration !== sessionGeneration) return;
            validationSaving = false;
            if (activeView === 'planning' && port === portSelect.value) {
                await refreshPlanCards('planning');
                $('postgres-planning-status').textContent = `Planning ${plan.code} soumis pour validation : le Chef Unité SR est prévenu par e-mail.`;
            }
        } catch (error) {
            if (requestGeneration === sessionGeneration) $('postgres-planning-status').textContent = `Soumission impossible : ${error.message}`;
        } finally {
            if (requestGeneration === sessionGeneration) validationSaving = false;
        }
    }

    async function openPlanningValidation(planId) {
        if (!hasRole(['admin', 'rh_chief']) || validationDraft || validationSaving || !portSelect.value) return;
        const port = portSelect.value, requestGeneration = sessionGeneration, sequence = requestSequence;
        const notice = $('postgres-planning-status');
        notice.textContent = 'Chargement de la validation…';
        try {
            const [plans, csbs, assessments] = await Promise.all([
                api('/rest/v1/rpc/qbox_list_plannings', {selected_port: port}, true),
                api('/rest/v1/rpc/qbox_list_csbs', {selected_port: port}, true),
                api('/rest/v1/rpc/qbox_planning_assessments', {selected_port: port, selected_planning: planId}, true)
            ]);
            if (requestGeneration !== sessionGeneration || sequence !== requestSequence || activeView !== 'planning' || port !== portSelect.value) return;
            const plan = plans.find(item => item.id === planId);
            if (!plan || plan.status !== 'En cours' || planningValidationState(plan) !== 'submitted')
                throw new Error('Ce planning n’est plus en attente de validation : actualisez la liste.');
            validationDraft = {port, plan, rows: [], districts: []};
            renderPlanningValidation(plan, csbs, assessments);
            $('plan-validation-notes').value = '';
            $('plan-validation-status').textContent = '';
            notice.textContent = '';
            portSelect.disabled = true;
            $('modal-backdrop').classList.remove('hidden');
            $('modal-planning-validation').classList.remove('hidden');
        } catch (error) {
            if (requestGeneration === sessionGeneration && sequence === requestSequence) notice.textContent = error.message;
        }
    }

    function validationCell(tag, text, className) {
        const cell = planningCell(tag, text, className);
        if (tag === 'th' && className.includes('pv-row-name')) cell.scope = 'row';
        return cell;
    }

    // Tableau de validation : districts → CSB → intrants (CMM, état de stock, besoin calculé, proposé, retenu, écart).
    function renderPlanningValidation(plan, csbs, assessments) {
        const csbInfo = new Map(csbs.map(csb => [csb.id, csb]));
        const evaluation = new Map(assessments.map(row => [`${row.csb_id}:${row.product_id}`, row]));
        $('plan-validation-subtitle').textContent = `${plan.code} · Campagne du ${plan.start_date} au ${plan.end_date} · soumis par ${
            plan.submitted_by_name || 'nom non renseigné'}${plan.submitted_at ? ` le ${localDateTime(plan.submitted_at)}` : ''}`;
        const districts = new Map();
        for (const item of plan.items) {
            const district = csbInfo.get(item.csb_id)?.district || NO_DISTRICT;
            if (!districts.has(district)) districts.set(district, new Map());
            const groups = districts.get(district);
            if (!groups.has(item.csb_id)) groups.set(item.csb_id, {name: item.csb_name, items: []});
            groups.get(item.csb_id).items.push(item);
        }
        const order = [...districts.keys()].sort((a, b) => a === NO_DISTRICT ? 1 : b === NO_DISTRICT ? -1 : a.localeCompare(b, 'fr'));
        let missing = 0;
        const sections = [];
        for (const district of order) {
            const section = planningCell('section', '', district === NO_DISTRICT ? 'pv-district pv-district-none' : 'pv-district');
            const head = planningCell('div', '', 'pv-district-head');
            const name = planningCell('h4', '', 'pv-district-name');
            name.append(planningIcon('ph-map-pin-area'), planningCell('span', district));
            const stats = planningCell('span', '', 'pv-district-stats');
            const groups = [...districts.get(district).values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
            head.append(name, planningCell('span', `${groups.length} CSB`, 'pv-district-count'), stats);
            section.append(head);
            const districtState = {stats, rows: []};
            for (const group of groups) {
                const block = planningCell('div', '', 'pv-csb');
                block.append(planningCell('h5', group.name, 'pv-csb-name'));
                const table = planningCell('table', '', 'pv-table');
                const thead = document.createElement('thead');
                const header = document.createElement('tr');
                for (const [text, right] of [['Intrant', false], ['CMM', true], ['État de stock', true], ['Besoin calculé', true], ['Proposé', true], ['Retenu', true], ['Écart', true]])
                    header.append(planningCell('th', text, right ? 'pv-th pv-right' : 'pv-th'));
                thead.append(header);
                const body = document.createElement('tbody');
                for (const item of group.items) {
                    const assessment = evaluation.get(`${item.csb_id}:${item.product_id}`);
                    const cmm = assessment?.cmm ?? null, stock = assessment?.stock_level ?? null;
                    if (cmm === null) missing += 1;
                    const need = cmm === null ? null : (() => { const value = BigInt(cmm) * BigInt(PLANNING_CMM_MONTHS) - BigInt(stock ?? 0); return value > 0n ? value : 0n; })();
                    const committed = BigInt(item.delivered ?? 0) + BigInt(item.in_flight ?? 0) + BigInt(item.in_transit ?? 0);
                    const proposed = BigInt(item.proposed ?? item.planned);
                    const row = document.createElement('tr');
                    const input = planningElement('input', 'pv-input');
                    Object.assign(input, {type: 'number', min: String(committed), max: '9007199254740991', step: '1', value: String(item.planned)});
                    input.setAttribute('aria-label', `Quantité retenue — ${group.name} · ${item.product_name}`);
                    const retained = planningCell('td', '', 'pv-cell pv-right');
                    retained.append(input);
                    if (committed > 0n) retained.append(planningCell('span', `min. ${number(committed)} (livré ou en route)`, 'pv-hint'));
                    const gap = planningCell('td', '', 'pv-num pv-gap');
                    row.append(validationCell('th', item.product_name, 'pv-row-name'),
                        planningCell('td', cmm === null ? 'Non saisie' : number(cmm), cmm === null ? 'pv-num pv-missing' : 'pv-num'),
                        planningCell('td', stock === null ? '—' : number(stock), 'pv-num'),
                        planningCell('td', need === null ? '—' : number(need), 'pv-num pv-need'),
                        planningCell('td', number(proposed), 'pv-num'), retained, gap);
                    const state = {item, input, gap, row, committed, proposed, district};
                    input.addEventListener('input', updatePlanningValidation);
                    validationDraft.rows.push(state);
                    districtState.rows.push(state);
                    body.append(row);
                }
                table.append(thead, body);
                const scroll = planningCell('div', '', 'pv-scroll');
                scroll.append(table);
                block.append(scroll);
                section.append(block);
            }
            validationDraft.districts.push(districtState);
            sections.push(section);
        }
        const csbCount = new Set(plan.items.map(item => item.csb_id)).size;
        const summary = [];
        for (const [label, value, tone] of [['CSB', String(csbCount), ''], ['Lignes de besoin', String(plan.items.length), ''],
            ['Lignes sans CMM', String(missing), missing ? 'pv-chip-warn' : 'pv-chip-ok']]) {
            const chip = planningCell('span', '', `pv-chip ${tone}`.trim());
            chip.append(planningCell('strong', value), planningCell('span', label));
            summary.push(chip);
        }
        $('plan-validation-summary').replaceChildren(...summary);
        $('plan-validation-content').replaceChildren(...sections);
        updatePlanningValidation();
    }

    // Écarts, totaux par district et récapitulatif ; une saisie invalide est signalée sur sa ligne.
    function updatePlanningValidation() {
        if (!validationDraft) return;
        let proposed = 0n, retained = 0n, adjusted = 0, invalid = 0;
        const value = state => {
            const parsed = planningWhole(state.input);
            return parsed === null || Number.isNaN(parsed) ? null : BigInt(parsed);
        };
        for (const state of validationDraft.rows) {
            const current = value(state);
            const wrong = current === null || current < state.committed;
            proposed += state.proposed;
            if (wrong) {
                invalid += 1;
                state.gap.textContent = current === null ? 'Invalide' : `min. ${number(state.committed)}`;
                state.gap.className = 'pv-num pv-gap pv-gap-invalid';
                state.row.className = 'pv-row is-invalid';
                continue;
            }
            retained += current;
            const delta = current - state.proposed;
            if (delta !== 0n) adjusted += 1;
            state.gap.textContent = delta === 0n ? '=' : delta > 0n ? `+${number(delta)}` : `−${number(-delta)}`;
            state.gap.className = `pv-num pv-gap${delta > 0n ? ' pv-gap-up' : delta < 0n ? ' pv-gap-down' : ''}`;
            state.row.className = delta === 0n ? 'pv-row' : 'pv-row is-adjusted';
        }
        for (const district of validationDraft.districts) {
            let total = 0n, changed = 0;
            for (const state of district.rows) {
                const current = value(state);
                if (current !== null) total += current;
                if (current !== null && current !== state.proposed) changed += 1;
            }
            district.stats.textContent = `Retenu : ${number(total)}${changed ? ` · ${changed} ajustement(s)` : ''}`;
        }
        $('plan-validation-totals').textContent = `Proposé : ${number(proposed)} · Retenu : ${number(retained)} · ${adjusted} ligne(s) ajustée(s)${invalid ? ` · ${invalid} à corriger` : ''}`;
    }

    function closePlanningValidation() {
        if (validationSaving) return;
        validationDraft = null;
        $('plan-validation-content').replaceChildren();
        $('plan-validation-summary').replaceChildren();
        $('modal-planning-validation').classList.add('hidden');
        $('modal-backdrop').classList.add('hidden');
        portSelect.disabled = activeView === 'operations';
    }

    // action : 'validate' (quantités retenues) ou 'return' (renvoi avec motif obligatoire).
    async function submitPlanningValidation(action) {
        if (!validationDraft || validationSaving) return;
        const status = $('plan-validation-status');
        const notes = String($('plan-validation-notes').value ?? '').trim();
        const {plan, port} = validationDraft;
        let path, body, message;
        if (action === 'return') {
            if (!notes) {
                status.textContent = 'Indiquez le motif du renvoi dans les observations.';
                $('plan-validation-notes').focus?.();
                return;
            }
            if (!confirm(`Renvoyer le planning ${plan.code} au coordinateur pour correction ?`)) return;
            path = 'qbox_return_planning';
            body = {selected_port: port, selected_planning: plan.id, expected_version: plan.version, reason: notes};
            message = `Planning ${plan.code} renvoyé pour correction : le coordinateur est prévenu par e-mail.`;
        } else {
            const items = [];
            for (const state of validationDraft.rows) {
                const parsed = planningWhole(state.input);
                const label = `${state.item.csb_name} · ${state.item.product_name}`;
                if (parsed === null || Number.isNaN(parsed)) {
                    status.textContent = `Quantité retenue invalide : ${label}.`;
                    state.input.focus?.();
                    return;
                }
                if (BigInt(parsed) < state.committed) {
                    status.textContent = `${label} : pas moins de ${number(state.committed)} (déjà livré ou en route).`;
                    state.input.focus?.();
                    return;
                }
                if (BigInt(parsed) !== BigInt(state.item.planned))
                    items.push({csb_id: state.item.csb_id, product_id: state.item.product_id, quantity: parsed});
            }
            if (!confirm(`Valider le planning ${plan.code}${items.length ? ` avec ${items.length} quantité(s) ajustée(s)` : ''} ?\n\nLe coordinateur sera prévenu par e-mail.`)) return;
            path = 'qbox_validate_planning';
            body = {selected_port: port, selected_planning: plan.id, expected_version: plan.version, items, observations: notes || null};
            message = `Planning ${plan.code} validé : le coordinateur est prévenu par e-mail.`;
        }
        const requestGeneration = sessionGeneration;
        validationSaving = true;
        status.textContent = action === 'return' ? 'Renvoi en cours…' : 'Validation en cours…';
        for (const id of ['plan-validation-submit', 'plan-validation-return', 'plan-validation-cancel']) $(id).disabled = true;
        try {
            await api(`/rest/v1/rpc/${path}`, body, true);
            if (requestGeneration !== sessionGeneration) return;
            validationSaving = false;
            closePlanningValidation();
            if (activeView === 'planning' && port === portSelect.value) {
                await refreshPlanCards('planning');
                $('postgres-planning-status').textContent = message;
            }
        } catch (error) {
            if (requestGeneration === sessionGeneration) status.textContent = error.message;
        } finally {
            if (requestGeneration === sessionGeneration) validationSaving = false;
            for (const id of ['plan-validation-submit', 'plan-validation-return', 'plan-validation-cancel']) $(id).disabled = false;
        }
    }

    // Tuile du tableau de bord (drone port) : planning en attente de validation, pour le Chef Unité SR
    // et l'administrateur. Chargée en arrière-plan ; sans effet si rien n'attend.
    // (Les coordinateurs voient l'état et le motif d'un renvoi sur la carte du planning.)
    function clearDashboardValidation() {
        $('dashboard-validation').replaceChildren();
        $('dashboard-validation').hidden = true;
    }

    async function loadDashboardValidation(port, sequence, requestGeneration) {
        const current = () => sequence === requestSequence && activeView === 'dashboard' && port === portSelect.value && sessionGeneration === requestGeneration;
        if (isStorage() || !hasRole(['admin', 'rh_chief'])) return;
        let plans;
        try { plans = await api('/rest/v1/rpc/qbox_list_plannings', {selected_port: port}, true); } catch { return; }
        if (!current()) return;
        const plan = plans.find(item => item.status === 'En cours' && planningValidationState(item) === 'submitted');
        if (!plan) return;
        const state = 'submitted', tone = 'pending';
        const title = `Planning ${plan.code} en attente de votre validation`;
        const text = `Soumis par ${plan.submitted_by_name || 'nom non renseigné'}${plan.submitted_at ? ` le ${localDateTime(plan.submitted_at)}` : ''} · ${
            new Set(plan.items.map(item => item.csb_id)).size} CSB · ${plan.items.length} ligne(s) de besoin.`;
        const action = ['Ouvrir la validation', () => { selectView('planning'); openPlanningValidation(plan.id); }];
        const box = $('dashboard-validation');
        box.className = `dv-banner dv-${tone}`;
        const icon = planningCell('span', '', 'dv-icon');
        icon.append(planningIcon(PLANNING_VALIDATION[state].icon));
        const body = planningCell('div', '', 'dv-body');
        body.append(planningCell('strong', title, 'dv-title'), planningCell('span', text, 'dv-text'));
        box.replaceChildren(icon, body);
        if (action) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'dv-action';
            button.textContent = action[0];
            button.addEventListener('click', action[1]);
            box.append(button);
        }
        box.hidden = false;
    }
    async function refreshNativeView(view) {
        const port = portSelect.value;
        const seq = ++requestSequence;
        const requestGeneration = sessionGeneration;
        const body = $(view === 'stocks' ? 'stocks-table-body' : 'salama-table-body');
        const notice = $(view === 'stocks' ? 'postgres-stocks-status' : 'postgres-salama-status');
        const cards = view === 'salama' ? $('salama-cards') : null;
        body.replaceChildren();
        cards?.replaceChildren();
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
                    cards?.append(receiptCard(receipt));
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
                if (!data[0].length) {
                    body.append(emptyTableRow('Aucune réception enregistrée.', 6));
                    const empty = document.createElement('p');
                    empty.className = 'px-4 py-6 text-center text-xs text-slate-500';
                    empty.textContent = 'Aucune réception enregistrée.';
                    cards?.append(empty);
                }
            }
            notice.textContent = `Actualisé le ${localDateTime(new Date())} (heure de Madagascar).`;
        } catch (error) {
            if (seq !== requestSequence || activeView !== view || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            body.replaceChildren();
            cards?.replaceChildren();
            notice.textContent = `Lecture indisponible : ${error.message}`;
        }
    }

    // Historique sur mobile : une carte par bon SALAMA, une ligne par intrant reçu.
    function receiptCard(receipt) {
        const card = document.createElement('article');
        card.className = 'px-4 py-3 space-y-2';
        const head = document.createElement('div');
        head.className = 'flex items-baseline justify-between gap-3';
        const reference = document.createElement('p');
        reference.className = 'font-mono font-bold text-sm text-slate-900 break-all';
        reference.textContent = receipt.reference;
        const date = document.createElement('p');
        date.className = 'shrink-0 text-[11px] text-slate-500';
        date.textContent = localDateTime(receipt.received_at);
        head.append(reference, date);
        const list = document.createElement('ul');
        list.className = 'space-y-1.5';
        for (const item of receipt.items) {
            const line = document.createElement('li');
            line.className = 'flex items-start justify-between gap-3 text-xs';
            const label = document.createElement('div');
            label.className = 'min-w-0';
            const name = document.createElement('p');
            name.className = 'font-bold text-slate-900';
            name.textContent = item.name;
            const lot = document.createElement('p');
            lot.className = 'font-mono text-[11px] font-bold text-amber-900';
            lot.textContent = `Lot ${item.lot}`;
            label.append(name, lot);
            const quantity = document.createElement('span');
            quantity.className = 'shrink-0 font-mono font-bold text-slate-900';
            quantity.textContent = number(item.quantity);
            line.append(label, quantity);
            list.append(line);
        }
        const status = document.createElement('p');
        status.className = 'text-[11px] font-bold text-emerald-700';
        status.textContent = `Réception enregistrée · ${receipt.items.length} ligne(s)`;
        card.append(head, list, status);
        return card;
    }

    // --- Réception SALAMA : lignes compactes sur une seule ligne, saisie rapide au clavier ---
    // Les lignes sont suivies en mémoire (ordre d'affichage) ; la soumission relit les champs nommés du formulaire.
    const RECEIPT_GRID = 'grid grid-cols-[2rem_minmax(0,2.2fr)_minmax(0,1fr)_9rem_7rem_4.5rem] gap-2 items-center';
    const RECEIPT_FIELD = 'w-full text-xs px-2.5 py-2 rounded-lg border bg-white focus:outline-none focus:border-amber-400';
    let receiptRows = [];

    function receiptRowComplete(entry) {
        const quantity = Number(entry.quantity.value);
        return Boolean(entry.product.value && entry.lot.value.trim() && entry.expiry.value && Number.isSafeInteger(quantity) && quantity > 0);
    }

    function receiptRowBlank(entry) {
        return !entry.product.value && !entry.lot.value.trim() && !entry.expiry.value && !String(entry.quantity.value ?? '').trim();
    }

    function markReceiptRow(entry, invalid) {
        entry.invalid = invalid;
        entry.row.className = `salama-row ${RECEIPT_GRID} px-2 py-1.5 rounded-xl border ${invalid ? 'border-red-300 bg-red-50/60' : 'border-slate-200 bg-white hover:border-slate-300'}`;
        for (const field of [entry.product, entry.lot, entry.expiry, entry.quantity])
            field.className = `${RECEIPT_FIELD} ${invalid && !field.value ? 'border-red-300' : 'border-slate-200'}${field === entry.quantity ? ' font-mono text-right' : field === entry.lot ? ' font-mono' : ''}`;
    }

    function updateReceiptSummary() {
        receiptRows.forEach((entry, index) => { entry.number.textContent = String(index + 1); });
        const complete = receiptRows.filter(receiptRowComplete);
        const total = complete.reduce((sum, entry) => sum + BigInt(entry.quantity.value), 0n);
        const products = new Set(complete.map(entry => entry.product.value)).size;
        $('salama-summary').textContent = receiptRows.length
            ? `${receiptRows.length} ligne(s) · ${complete.length} complète(s) · ${products} intrant(s) distinct(s) · Total reçu : ${number(total)} unité(s)`
            : 'Aucune ligne : ajoutez un intrant.';
        $('salama-head').hidden = receiptRows.length === 0;
    }

    function receiptInput(name, type, label) {
        const input = document.createElement(type === 'select' ? 'select' : 'input');
        input.name = name;
        input.required = true;
        input.setAttribute('aria-label', label);
        input.setAttribute('data-area', name);
        if (type !== 'select') input.type = type;
        return input;
    }

    // Étiquette visible seulement sur mobile (la ligne devient une carte) ; sur PC, l'en-tête de colonnes suffit.
    let receiptFieldSequence = 0;
    function receiptCaption(field, text) {
        field.id = `salama-field-${++receiptFieldSequence}`;
        const caption = document.createElement('label');
        caption.htmlFor = field.id;
        caption.className = 'sm:hidden text-[11px] font-semibold text-slate-600';
        caption.setAttribute('data-area', `${field.name}-caption`);
        caption.textContent = text;
        return caption;
    }

    function addReceiptRow(products, {after = null, productId = '', expiry = '', focus = true} = {}) {
        const row = document.createElement('div');
        const lineNumber = document.createElement('span');
        lineNumber.className = 'text-center text-[10px] font-bold font-mono text-slate-400';
        lineNumber.setAttribute('data-area', 'number');
        const product = receiptInput('product', 'select', 'Intrant');
        product.add(new Option('Sélectionner un intrant…', ''));
        for (const item of products) product.add(new Option(`${item.code} · ${item.name} · ${item.unit}`, item.id));
        product.value = productId;
        const lot = receiptInput('lot', 'text', 'N° de lot');
        lot.maxLength = 120;
        lot.placeholder = 'N° de lot';
        const expiryInput = receiptInput('expiry', 'date', 'Date de péremption');
        expiryInput.value = expiry;
        const quantity = receiptInput('quantity', 'number', 'Quantité');
        Object.assign(quantity, {min: '1', max: '9007199254740991', step: '1', placeholder: 'Qté'});
        quantity.setAttribute('inputmode', 'numeric');
        const actions = document.createElement('div');
        actions.className = 'flex items-center justify-end gap-1';
        actions.setAttribute('data-area', 'actions');
        const duplicate = document.createElement('button');
        duplicate.type = 'button';
        duplicate.className = 'w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg';
        duplicate.title = 'Dupliquer : même intrant et même péremption, nouveau lot';
        duplicate.setAttribute('aria-label', 'Dupliquer cette ligne');
        const copyIcon = document.createElement('i');
        copyIcon.className = 'ph ph-copy';
        copyIcon.setAttribute('aria-hidden', 'true');
        duplicate.append(copyIcon);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg';
        remove.title = 'Retirer cet intrant';
        remove.setAttribute('aria-label', 'Retirer cette ligne');
        const removeIcon = document.createElement('i');
        removeIcon.className = 'ph ph-x';
        removeIcon.setAttribute('aria-hidden', 'true');
        remove.append(removeIcon);
        actions.append(duplicate, remove);
        // Le numéro reste le premier enfant et les actions le dernier ; la carte mobile les place par zones (modern-theme.css).
        row.append(lineNumber, receiptCaption(product, 'Intrant'), product, receiptCaption(lot, 'N° de lot'), lot,
            receiptCaption(expiryInput, 'Péremption'), expiryInput, receiptCaption(quantity, 'Quantité'), quantity, actions);
        const entry = {row, number: lineNumber, product, lot, expiry: expiryInput, quantity, invalid: false};
        markReceiptRow(entry, false);
        const changed = () => { if (entry.invalid && receiptRowComplete(entry)) markReceiptRow(entry, false); updateReceiptSummary(); };
        for (const field of [product, lot, expiryInput, quantity]) {
            field.addEventListener(field === product ? 'change' : 'input', changed);
            // Entrée : ligne suivante (créée si c'est la dernière) au lieu de soumettre le formulaire.
            field.addEventListener('keydown', event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                const next = receiptRows[receiptRows.indexOf(entry) + 1];
                if (next) next.product.focus?.();
                else if (!receiptRowBlank(entry)) addReceiptRow(receiptProducts);
            });
        }
        duplicate.addEventListener('click', () => addReceiptRow(receiptProducts, {after: entry, productId: product.value, expiry: expiryInput.value}));
        remove.addEventListener('click', () => {
            receiptRows = receiptRows.filter(item => item !== entry);
            $('salama-items').replaceChildren(...receiptRows.map(item => item.row));
            updateReceiptSummary();
        });
        const index = after ? receiptRows.indexOf(after) + 1 : receiptRows.length;
        receiptRows.splice(index, 0, entry);
        if (after) $('salama-items').replaceChildren(...receiptRows.map(item => item.row));
        else $('salama-items').append(row);
        updateReceiptSummary();
        if (focus) {
            row.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
            (after ? lot : product).focus?.();
        }
        return entry;
    }

    function addReceiptRows(count) {
        let first = null;
        for (let index = 0; index < count; index++) {
            const entry = addReceiptRow(receiptProducts, {focus: false});
            first ||= entry;
        }
        first?.row.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
        first?.product.focus?.();
    }

    function resetReceiptRows() {
        receiptRows = [];
        $('salama-items').replaceChildren();
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
            resetReceiptRows();
            $('postgres-salama-form-status').textContent = `Identifiant de réception : ${receiptId}`;
            addReceiptRow(products, {focus: false});
            $('modal-backdrop').classList.remove('hidden');
            $('modal-salama').classList.remove('hidden');
            $('salama-id').focus?.();
        } catch (error) {
            if (sessionGeneration === requestGeneration) $(activeView === 'stocks' ? 'postgres-stocks-status' : 'postgres-salama-status').textContent = error.message;
        } finally { if (sessionGeneration === requestGeneration) receiptOpening = false; }
    }

    function closeReceipt() {
        if (receiptSaving) return;
        receiptId = null;
        receiptPort = null;
        receiptProducts = [];
        resetReceiptRows();
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
        const invalidLines = items.map((item, index) => (!item.product_id || !item.lot || !item.expiry_date ||
            !Number.isSafeInteger(item.quantity) || item.quantity <= 0) ? index + 1 : 0).filter(Boolean);
        receiptRows.forEach((entry, index) => markReceiptRow(entry, invalidLines.includes(index + 1)));
        if (!reference || !items.length || invalidLines.length) {
            formStatus.textContent = !reference ? 'Indiquez le numéro du bon SALAMA.'
                : !items.length ? 'Ajoutez au moins un intrant.'
                : `Complétez ou retirez ${invalidLines.length > 1 ? 'les lignes' : 'la ligne'} ${invalidLines.join(', ')} : intrant, lot, date de péremption et quantité valides sont requis.`;
            const firstInvalid = receiptRows[invalidLines[0] - 1];
            firstInvalid?.row.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
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

    // ---------- Lecture de codes-barres (barcode-scanner.js) ----------
    function scannerAvailable(statusId) {
        if (typeof QBoxScanner !== 'undefined') return true;
        $(statusId).textContent = 'Lecteur de codes-barres indisponible : actualisez la page.';
        return false;
    }

    function unknownCodeMessage(parsed) {
        if (!parsed) return 'Aucun code lu.';
        if (!parsed.gtin) return `Code lu « ${parsed.raw} » : ce n’est pas un code produit (GS1 ou EAN).`;
        return `Code ${parsed.gtin} inconnu : renseignez ce GTIN dans la fiche de l’intrant (référentiel des intrants).`;
    }

    // Fiche intrant : remplit le GTIN.
    function scanProductGtin() {
        if (!scannerAvailable('postgres-product-form-status')) return;
        QBoxScanner.open({ title: 'Scanner le code de la boîte', onResult: parsed => {
            if (!productOpen) return;
            if (!parsed?.gtin) {
                $('postgres-product-form-status').textContent = unknownCodeMessage(parsed);
                return;
            }
            $('product-gtin').value = parsed.gtin;
            $('postgres-product-form-status').textContent = `Code ${parsed.gtin} lu.`;
        } });
    }

    // Réception : remplit intrant, lot et péremption sur la première ligne vide (ou une nouvelle ligne).
    function applyReceiptScan(parsed) {
        const status = $('postgres-salama-form-status');
        const product = parsed?.gtin ? receiptProducts.find(item => item.gtin === parsed.gtin) : null;
        if (!product) {
            status.textContent = unknownCodeMessage(parsed);
            return;
        }
        const entry = receiptRows.find(row => receiptRowBlank(row)) || addReceiptRow(receiptProducts, {focus: false});
        entry.product.value = product.id;
        if (parsed.lot) entry.lot.value = parsed.lot;
        if (parsed.expiry) entry.expiry.value = parsed.expiry;
        updateReceiptSummary();
        entry.row.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
        (parsed.lot && parsed.expiry ? entry.quantity : parsed.lot ? entry.expiry : entry.lot).focus?.();
        const missing = [!parsed.lot && 'n° de lot', !parsed.expiry && 'péremption'].filter(Boolean);
        status.textContent = `${product.name} ajouté${missing.length ? ` : complétez ${missing.join(' et ')}` : ''}, puis la quantité.`;
    }

    function scanReceipt() {
        if (!receiptId || receiptSaving || !scannerAvailable('postgres-salama-form-status')) return;
        const id = receiptId;
        QBoxScanner.open({ title: 'Scanner un intrant reçu', onResult: parsed => { if (receiptId === id) applyReceiptScan(parsed); } });
    }

    // Inventaire : retrouve la ligne du lot scanné et place le curseur sur sa quantité comptée.
    async function applyInventoryScan(parsed) {
        const draft = inventoryDraft, status = $('postgres-inventory-status');
        if (!draft) return;
        if (!parsed?.gtin) {
            status.textContent = unknownCodeMessage(parsed);
            return;
        }
        try {
            draft.products ||= await api('/rest/v1/rpc/qbox_list_products', {}, true);
        } catch (error) {
            status.textContent = `Référentiel indisponible : ${error.message}`;
            return;
        }
        if (inventoryDraft !== draft) return;
        const product = draft.products.find(item => item.gtin === parsed.gtin);
        if (!product) {
            status.textContent = unknownCodeMessage(parsed);
            return;
        }
        const sameLot = value => String(value).trim().toLowerCase() === String(parsed.lot || '').trim().toLowerCase();
        const lots = draft.items.filter(item => item.product_name === product.name);
        const matches = parsed.lot ? lots.filter(item => sameLot(item.lot)) : lots;
        if (matches.length !== 1) {
            status.textContent = !lots.length ? `${product.name} : aucun lot de cet intrant dans l’inventaire.`
                : parsed.lot && !matches.length ? `${product.name} lot ${parsed.lot} : lot absent de l’inventaire (lots attendus : ${lots.map(item => item.lot).join(', ')}).`
                    : `${product.name} : ${lots.length} lots possibles, saisissez la quantité sur la bonne ligne (le code ne contient pas de n° de lot).`;
            return;
        }
        const input = draft.inputs.get(matches[0].stock_id);
        input.scrollIntoView?.({block: 'center', behavior: 'smooth'});
        input.focus?.();
        input.select?.();
        status.textContent = `${product.name} · lot ${matches[0].lot} : saisissez la quantité comptée.`;
    }

    function scanInventory() {
        if (!inventoryDraft || inventorySaving || !scannerAvailable('postgres-inventory-status')) return;
        QBoxScanner.open({ title: 'Scanner un lot inventorié', onResult: parsed => applyInventoryScan(parsed) });
    }

    // ---------- Statistiques techniques des vols drone — style : technical-stats.css (préfixe ts-) ----------
    // Données : qbox_technical_statistics (copie nocturne, en lecture seule, de la base de l'application de
    // maintenance des pilotes). Tous les drone ports à la fois, comme la vue nationale ; grand total du projet
    // (tout l'historique) en haut, puis la période choisie (raccourcis ou dates Du/Au).
    // Seules les livraisons réussies (vol de livraison sans retour anticipé) sont mises en avant ; les retours
    // anticipés (QRF) et les vols de contrôle sont seulement comptés à part. La consommation n'est pas affichée.
    // Carte : Leaflet (leaflet.js, hébergé avec le site, chargé à la demande) + tuiles gratuites OpenStreetMap.
    const TECHNICAL_PRESETS = ['all', '12m', 'year', 'month'];
    // Couleur d'un drone port : palette catégorielle validée (daltonisme), ordre fixe par date de mise en service.
    const TECHNICAL_COLORS = {
        light: ['#257de0', '#f47230', '#00b894', '#ee7fac', '#6a4ce2', '#008a17'],
        dark: ['#338ced', '#e76624', '#00a888', '#e24d8b', '#9887ef', '#0aac23']
    };
    const TECHNICAL_CSB_LIMIT = 8;
    let technicalSequence = 0;
    let technicalData = null;
    let technicalPreset = 'all';
    let technicalCsbsAll = false;
    let technicalMap = null;
    let technicalMapLayers = null;
    let technicalTiles = null;
    let leafletLoading = null;

    function tsElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== '' && text !== null && text !== undefined) element.textContent = String(text);
        return element;
    }

    function tsDark() {
        return Boolean(document.documentElement?.classList?.contains?.('qb-dark'));
    }

    function tsColors() {
        return TECHNICAL_COLORS[tsDark() ? 'dark' : 'light'];
    }

    function tsInt(value) {
        return Math.round(Number(value || 0)).toLocaleString('fr-FR').replace(/ /g, ' ');
    }

    function tsDecimal(value, digits = 1) {
        return Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/ /g, ' ');
    }

    function tsHours(minutes) {
        return tsInt(Number(minutes || 0) / 60);
    }

    function tsDuration(minutes) {
        const value = Math.round(Number(minutes || 0));
        return value >= 60 ? `${Math.floor(value / 60)} h ${String(value % 60).padStart(2, '0')}` : `${value} min`;
    }

    function tsDaysBetween(from, to) {
        return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
    }

    function tsFrame(callback) {
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
        else callback();
    }

    // Compteur animé (0 → valeur) ; valeur finale écrite directement sans animation possible.
    function tsCountUp(element, target, format) {
        element.textContent = format(target);
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        if (reduce || typeof window.requestAnimationFrame !== 'function' || !(target > 0)) return;
        const start = performance.now(), duration = 1100;
        const step = now => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = format(target * eased);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    // Période choisie : raccourci, ou dates saisies (période personnalisée).
    function technicalPresetRange(preset) {
        const today = dsToday();
        const [year, month, day] = today.split('-').map(Number);
        if (preset === '12m') return { from: new Date(Date.UTC(year - 1, month - 1, day + 1)).toISOString().slice(0, 10), to: today };
        if (preset === 'year') return { from: `${year}-01-01`, to: today };
        if (preset === 'month') return { from: `${today.slice(0, 8)}01`, to: today };
        return { from: '', to: '' };
    }

    function technicalPeriod() {
        const from = $('technical-from').value || null, to = $('technical-to').value || null;
        if (from && to && from > to) return { from, to, error: 'La date de début doit précéder la date de fin.' };
        const labels = { all: 'Depuis le début', '12m': '12 derniers mois', year: 'Année en cours', month: 'Mois en cours' };
        const range = from && to ? `du ${dsDate(from)} au ${dsDate(to)}` : from ? `depuis le ${dsDate(from)}` : to ? `jusqu’au ${dsDate(to)}` : '';
        const name = technicalPreset === 'custom' ? 'Période personnalisée' : labels[technicalPreset];
        return { from, to, label: range ? `${name} (${range})` : name };
    }

    function markTechnicalPreset(preset) {
        technicalPreset = preset;
        for (const key of TECHNICAL_PRESETS) $(`technical-preset-${key}`).setAttribute('aria-pressed', String(key === preset));
    }

    function selectTechnicalPreset(preset) {
        markTechnicalPreset(preset);
        const range = technicalPresetRange(preset);
        $('technical-from').value = range.from;
        $('technical-to').value = range.to;
        $('technical-to').min = range.from;
        $('technical-from').max = range.to;
        refreshTechnicalStats();
    }

    function changeTechnicalDates() {
        const empty = !$('technical-from').value && !$('technical-to').value;
        markTechnicalPreset(empty ? 'all' : 'custom');
        $('technical-to').min = $('technical-from').value || '';
        $('technical-from').max = $('technical-to').value || '';
        refreshTechnicalStats();
    }

    function clearTechnicalStats() {
        technicalSequence++;
        technicalData = null;
        for (const id of ['technical-grand', 'technical-kpis', 'technical-ports', 'technical-months', 'technical-hours', 'technical-orgs',
            'technical-csbs', 'technical-map-legend']) $(id).replaceChildren();
        $('technical-grand-flights').textContent = '—';
        $('technical-grand-since').textContent = '';
        $('technical-map-status').textContent = '';
        $('technical-csbs-more').hidden = true;
        technicalMapLayers?.clearLayers?.();
    }

    async function refreshTechnicalStats() {
        clearTechnicalStats();
        const status = $('technical-status');
        $('technical-refresh').hidden = userRole !== 'admin';
        const period = technicalPeriod();
        if (period.error) { status.textContent = period.error; return; }
        const sequence = technicalSequence, requestGeneration = sessionGeneration;
        status.textContent = 'Chargement des statistiques techniques…';
        try {
            const data = await api('/rest/v1/rpc/qbox_technical_statistics', { from_date: period.from, to_date: period.to }, true);
            if (sequence !== technicalSequence || activeView !== 'technical' || sessionGeneration !== requestGeneration) return;
            technicalData = data;
            renderTechnicalStats(data, period);
        } catch (error) {
            if (sequence === technicalSequence && activeView === 'technical' && sessionGeneration === requestGeneration)
                status.textContent = `Statistiques techniques indisponibles : ${error.message}`;
        }
    }

    async function refreshTechnicalCopy() {
        if (userRole !== 'admin') return;
        const button = $('technical-refresh');
        button.disabled = true;
        $('technical-status').textContent = 'Copie des données des pilotes en cours…';
        try {
            const message = await api('/rest/v1/rpc/qbox_refresh_technical_statistics', {}, true);
            $('technical-status').textContent = String(message || '');
            await refreshTechnicalStats();
        } catch (error) {
            $('technical-status').textContent = `Copie impossible : ${error.message}`;
        } finally {
            button.disabled = false;
        }
    }

    // Couleur par drone port (ordre de mise en service, puis nom) : stable quel que soit le filtre.
    function technicalPortColors(ports) {
        const colors = tsColors();
        const ordered = [...ports].sort((a, b) => String(a.first_ever).localeCompare(String(b.first_ever)) || String(a.name).localeCompare(String(b.name)));
        return new Map(ordered.map((port, index) => [port.id, colors[index % colors.length]]));
    }

    function renderTechnicalStats(data, period) {
        const sync = data.sync;
        const colors = technicalPortColors(data.ports || []);
        let message;
        if (!sync) message = 'Aucune donnée : la connexion à la base des pilotes n’est pas encore configurée (voir GUIDE-MISE-EN-LIGNE.md).';
        else if (!sync.ok) message = `Dernière copie échouée le ${localDateTime(sync.attempted_at)} : ${sync.message || 'erreur inconnue'}.`
            + (sync.synced_at ? ` Données affichées : copie du ${localDateTime(sync.synced_at)}.` : '');
        else message = `${period.label} · données des pilotes copiées le ${localDateTime(sync.synced_at)} (heure de Madagascar).`;
        $('technical-status').textContent = message;
        renderTechnicalGrand(data);
        renderTechnicalKpis(data.totals || {});
        renderTechnicalPorts(data, colors);
        renderTechnicalMonths(data, colors);
        renderTechnicalHours(data.hours || []);
        renderTechnicalOrgs(data.organizations || []);
        renderTechnicalCsbs(data.csbs || [], colors);
        renderTechnicalLegend(data.ports || [], colors);
        renderTechnicalMap(data, colors);
    }

    // Encadré « À part » : retours anticipés (QRF) et vols de contrôle, seulement comptés.
    function technicalAside(className, qrf, controls) {
        const box = tsElement('div', className);
        const head = tsElement('span', 'ts-aside-label');
        head.append(dsIcon('ph-note'), tsElement('span', '', 'À part'));
        const list = tsElement('ul');
        for (const [icon, value, label] of [['ph-arrow-u-up-left', qrf, 'retour(s) anticipé(s) (QRF)'], ['ph-wrench', controls, 'vol(s) de contrôle']]) {
            const item = tsElement('li');
            item.append(dsIcon(icon), tsElement('b', '', tsInt(value)), tsElement('span', '', label));
            list.append(item);
        }
        box.append(head, list);
        return box;
    }

    // Grand total du projet (tout l'historique, tous les drone ports) : livraisons réussies.
    function renderTechnicalGrand(data) {
        const project = data.project || {};
        tsCountUp($('technical-grand-flights'), Number(project.deliveries || 0), tsInt);
        $('technical-grand-since').textContent = data.since
            ? `depuis le ${dsDate(data.since)} · ${tsInt(project.ports)} drone port(s) · ${tsInt(project.days)} jour(s) de livraison`
            : 'aucun vol enregistré';
        const strip = $('technical-grand');
        const items = [
            ['ph-timer', Number(project.minutes || 0) / 60, tsInt, 'heures de vol'],
            ['ph-path', Number(project.km || 0), tsInt, 'km parcourus'],
            ['ph-package', Number(project.kg || 0), value => tsDecimal(value, 0), 'kg livrés'],
            ['ph-first-aid-kit', Number(project.csbs || 0), tsInt, 'CSB desservis']
        ];
        items.forEach(([icon, value, format, label], index) => {
            const item = tsElement('div', 'ts-grand-item');
            item.style.setProperty?.('--i', String(index));
            const figure = tsElement('b');
            item.append(dsIcon(icon), figure, tsElement('span', '', label));
            strip.append(item);
            tsCountUp(figure, value, format);
        });
        const aside = technicalAside('ts-grand-aside', project.qrf, project.controls);
        aside.style.setProperty?.('--i', String(items.length));
        strip.append(aside);
    }

    function renderTechnicalKpis(totals) {
        const kpis = $('technical-kpis');
        const tiles = [
            ['ph-seal-check', 'Livraisons réussies', Number(totals.deliveries || 0), tsInt,
                totals.first_day ? `du ${dsDate(totals.first_day)} au ${dsDate(totals.last_day)} · ${tsInt(totals.days)} jour(s) de livraison` : 'aucune livraison sur la période', 'green ts-kpi-main'],
            ['ph-timer', 'Heures de vol', Number(totals.minutes || 0) / 60, value => tsDecimal(value, 0), `durée moyenne d’une livraison : ${tsDuration(totals.avg_minutes)}`, 'violet'],
            ['ph-path', 'Distance parcourue', Number(totals.km || 0), tsInt, `km · vitesse moyenne ${tsInt(totals.avg_speed)} km/h`, 'aqua'],
            ['ph-package', 'Poids livré', Number(totals.kg || 0), value => tsDecimal(value, 1), `kg · ${tsDecimal(totals.avg_payload, 1)} kg en moyenne par livraison`, 'orange'],
            ['ph-first-aid-kit', 'CSB desservis', Number(totals.csbs || 0), tsInt, `livraison la plus lointaine : ${tsInt(totals.longest_km)} km`, 'blue']
        ];
        tiles.forEach(([icon, label, value, format, hint, tone], index) => {
            const tile = tsElement('div', `ts-kpi ts-tone-${tone}`);
            tile.style.setProperty?.('--i', String(index));
            const head = tsElement('span', 'ts-kpi-label');
            head.append(dsIcon(icon), tsElement('span', '', label));
            const figure = tsElement('strong', 'ts-kpi-value');
            tile.append(head, figure, tsElement('span', 'ts-kpi-hint', hint));
            kpis.append(tile);
            tsCountUp(figure, value, format);
        });
        const aside = technicalAside('ts-kpi ts-kpi-aside', totals.qrf, totals.controls);
        aside.style.setProperty?.('--i', String(tiles.length));
        kpis.append(aside);
    }

    function renderTechnicalPorts(data, colors) {
        const container = $('technical-ports');
        const ports = data.ports || [];
        if (!ports.length) {
            container.append(tsElement('p', 'ts-empty', 'Aucun drone port avec des vols enregistrés.'));
            return;
        }
        const max = Math.max(...ports.map(port => Number(port.deliveries || 0)), 1);
        ports.forEach((port, index) => {
            const card = tsElement('button', port.deliveries ? 'ts-port' : 'ts-port ts-port-idle');
            card.type = 'button';
            card.style.setProperty?.('--c', colors.get(port.id));
            card.style.setProperty?.('--i', String(index));
            card.title = port.latitude != null ? `Centrer la carte sur ${port.name}` : port.name;
            card.addEventListener('click', () => focusTechnicalPort(port));
            const head = tsElement('div', 'ts-port-head');
            const icon = tsElement('span', 'ts-port-icon');
            icon.append(dsIcon('ph-drone'));
            const name = tsElement('div', 'ts-port-name');
            name.append(tsElement('strong', '', port.name),
                tsElement('span', '', [port.district, port.region].filter(Boolean).join(' · ') || 'Drone port'));
            head.append(icon, name);
            const total = Number(port.total_ever || 0);
            const service = tsElement('p', 'ts-port-since');
            service.append(dsIcon('ph-flag-banner'), tsElement('span', '',
                port.first_ever ? `En service depuis le ${dsDate(port.first_ever)} · ${tsInt(total)} livraison${total > 1 ? 's' : ''} réussie${total > 1 ? 's' : ''} au total` : 'Aucun vol'));
            if (!port.active) service.append(tsElement('em', 'ts-port-off', 'inactif'));
            const figure = tsElement('div', 'ts-port-figure');
            const deliveries = tsElement('strong');
            figure.append(deliveries, tsElement('span', '', 'livraisons réussies sur la période'));
            tsCountUp(deliveries, Number(port.deliveries || 0), tsInt);
            const meter = tsElement('span', 'ts-port-meter');
            const fill = tsElement('i');
            fill.style.width = '0%';
            meter.append(fill);
            tsFrame(() => { fill.style.width = `${Number(port.deliveries || 0) * 100 / max}%`; });
            const facts = tsElement('ul', 'ts-port-facts');
            for (const [icon, value, label] of [
                ['ph-timer', tsHours(port.minutes), 'h de vol'], ['ph-path', tsInt(port.km), 'km'],
                ['ph-package', tsDecimal(port.kg, 0), 'kg'], ['ph-first-aid-kit', tsInt(port.csbs), 'CSB']
            ]) {
                const fact = tsElement('li');
                fact.append(dsIcon(icon), tsElement('b', '', value), tsElement('span', '', label));
                facts.append(fact);
            }
            card.append(head, service, figure, meter, facts, technicalSparkline(port.months || []));
            if ((port.top || []).length) {
                const top = tsElement('div', 'ts-port-top');
                top.append(tsElement('span', 'ts-port-top-title', 'CSB les plus desservis'));
                for (const item of port.top) top.append(tsElement('span', 'ts-chip', `${item.name} · ${tsInt(item.deliveries)}`));
                card.append(top);
            }
            if (Number(port.qrf || 0) || Number(port.controls || 0))
                card.append(tsElement('span', 'ts-port-aside', `À part : ${tsInt(port.qrf)} QRF · ${tsInt(port.controls)} vol(s) de contrôle`));
            container.append(card);
        });
    }

    // Petite courbe en barres des livraisons réussies par mois d'un drone port.
    function technicalSparkline(months) {
        const spark = tsElement('div', 'ts-spark');
        spark.setAttribute('aria-hidden', 'true');
        const recent = months.slice(-18);
        const max = Math.max(...recent.map(month => Number(month.deliveries || 0)), 1);
        recent.forEach((month, index) => {
            const bar = tsElement('i');
            bar.style.setProperty?.('--h', `${Math.max(6, Number(month.deliveries || 0) * 100 / max)}%`);
            bar.style.setProperty?.('--i', String(index));
            bar.title = `${dsMonth(month.month, true)} : ${tsInt(month.deliveries)} livraison(s) réussie(s)`;
            spark.append(bar);
        });
        return spark;
    }

    function renderTechnicalLegend(ports, colors) {
        const legend = $('technical-map-legend');
        for (const port of ports) {
            const item = tsElement('span', 'ts-legend-item');
            const dot = tsElement('i', 'ts-dot');
            dot.style.setProperty?.('--c', colors.get(port.id));
            item.append(dot, tsElement('span', '', port.name));
            legend.append(item);
        }
    }

    // Livraisons réussies par mois, empilées par drone port.
    function renderTechnicalMonths(data, colors) {
        const container = $('technical-months');
        const months = data.months || [];
        if (!months.length) { container.append(tsElement('p', 'ts-empty', 'Aucune livraison réussie sur cette période.')); return; }
        const max = Math.max(...months.map(month => Number(month.deliveries || 0)), 1);
        const best = months.reduce((top, month) => Number(month.deliveries) > Number(top.deliveries) ? month : top, months[0]);
        const names = new Map((data.ports || []).map(port => [port.id, port.name]));
        const chart = tsElement('ol', months.length > 14 ? 'ts-bars ts-bars-dense' : 'ts-bars');
        chart.setAttribute('aria-label', 'Livraisons réussies par mois');
        months.forEach((month, index) => {
            const item = tsElement('li', month === best ? 'ts-bar ts-bar-best' : 'ts-bar');
            item.tabIndex = 0;
            const label = `${dsMonth(month.month, true)} : ${tsInt(month.deliveries)} livraison(s) réussie(s), ${tsDecimal(month.hours, 0)} h, ${tsInt(month.km)} km, ${tsDecimal(month.kg, 0)} kg`;
            item.title = label;
            item.setAttribute('aria-label', label);
            const stack = tsElement('span', 'ts-stack');
            stack.style.setProperty?.('--h', `${Number(month.deliveries || 0) * 100 / max}%`);
            stack.style.setProperty?.('--i', String(index));
            for (const part of month.ports || []) {
                const segment = tsElement('i');
                segment.style.flexGrow = String(part.deliveries);
                segment.style.setProperty?.('--c', colors.get(part.port_id) || 'var(--qb-muted)');
                segment.title = `${names.get(part.port_id) || 'Drone port'} : ${tsInt(part.deliveries)} livraison(s)`;
                stack.append(segment);
            }
            const tip = tsElement('span', 'ts-bar-tip');
            tip.setAttribute('aria-hidden', 'true');
            tip.append(tsElement('b', '', `${tsInt(month.deliveries)} livraisons`), tsElement('span', '', dsMonth(month.month, true)));
            const track = tsElement('span', 'ts-bar-track');
            track.append(stack, tip);
            item.append(track, tsElement('span', 'ts-bar-label', `${dsMonth(month.month)} ${String(month.month).slice(2, 4)}`));
            chart.append(item);
        });
        const foot = tsElement('p', 'ts-foot');
        foot.append(dsIcon('ph-trophy'), tsElement('span', '', `Mois record : ${dsMonth(best.month, true)} avec ${tsInt(best.deliveries)} livraisons réussies`));
        container.append(chart, foot);
    }

    function renderTechnicalHours(hours) {
        const container = $('technical-hours');
        if (!hours.length) return;
        const byHour = new Map(hours.map(item => [Number(item.hour), Number(item.deliveries)]));
        const first = Math.min(6, ...hours.map(item => Number(item.hour)));
        const last = Math.max(18, ...hours.map(item => Number(item.hour)));
        const max = Math.max(...hours.map(item => Number(item.deliveries)), 1);
        const peak = hours.reduce((top, item) => Number(item.deliveries) > Number(top.deliveries) ? item : top, hours[0]);
        const row = tsElement('div', 'ts-hours-row');
        for (let hour = first; hour <= last; hour++) {
            const count = byHour.get(hour) || 0;
            const cell = tsElement('span', 'ts-hour');
            cell.style.setProperty?.('--a', String(count / max));
            cell.style.setProperty?.('--i', String(hour - first));
            cell.title = `${String(hour).padStart(2, '0')} h : ${tsInt(count)} décollage(s)`;
            const bar = tsElement('i');
            bar.style.setProperty?.('--h', `${Math.max(count ? 8 : 2, count * 100 / max)}%`);
            cell.append(bar, tsElement('b', '', `${hour}h`));
            row.append(cell);
        }
        const foot = tsElement('p', 'ts-foot');
        foot.append(dsIcon('ph-sun-horizon'), tsElement('span', '', `Pic d’activité entre ${peak.hour} h et ${Number(peak.hour) + 1} h (${tsInt(peak.deliveries)} décollages)`));
        container.append(row, foot);
    }

    function renderTechnicalOrgs(orgs) {
        const container = $('technical-orgs');
        if (!orgs.length) return;
        const total = orgs.reduce((sum, item) => sum + Number(item.deliveries || 0), 0) || 1;
        container.append(tsElement('p', 'ts-subtitle', 'Livraisons réussies par bénéficiaire'));
        const bar = tsElement('div', 'ts-orgs-bar');
        bar.setAttribute('aria-hidden', 'true');
        const list = tsElement('ul', 'ts-orgs-list');
        orgs.forEach((org, index) => {
            const segment = tsElement('i', `ts-org-${index % 5}`);
            segment.style.flexGrow = String(org.deliveries);
            bar.append(segment);
            const item = tsElement('li', `ts-org-${index % 5}`);
            item.append(tsElement('i', 'ts-dot'), tsElement('span', '', org.name),
                tsElement('b', '', `${tsInt(org.deliveries)} · ${Math.round(Number(org.deliveries) * 100 / total)} %`));
            list.append(item);
        });
        container.append(bar, list);
    }

    function renderTechnicalCsbs(csbs, colors) {
        const list = $('technical-csbs');
        list.replaceChildren();
        if (!csbs.length) { list.append(tsElement('li', 'ts-empty', 'Aucune livraison réussie sur cette période.')); return; }
        const shown = technicalCsbsAll ? csbs : csbs.slice(0, TECHNICAL_CSB_LIMIT);
        const max = Math.max(...csbs.map(csb => Number(csb.deliveries || 0)), 1);
        shown.forEach((csb, index) => {
            const item = tsElement('li', 'ts-csb');
            item.style.setProperty?.('--i', String(index));
            item.style.setProperty?.('--c', colors.get(csb.port_id) || 'var(--qb-primary)');
            const rank = tsElement('span', index < 3 ? 'ts-rank ts-rank-top' : 'ts-rank', String(index + 1));
            const body = tsElement('div', 'ts-csb-body');
            const head = tsElement('div', 'ts-csb-head');
            const name = tsElement('span', 'ts-csb-name', csb.name);
            name.title = [csb.name, csb.district, csb.port_name].filter(Boolean).join(' · ');
            head.append(name, tsElement('b', '', `${tsInt(csb.deliveries)} livr.`));
            const meter = tsElement('span', 'ts-csb-meter');
            const fill = tsElement('i');
            fill.style.width = '0%';
            meter.append(fill);
            tsFrame(() => { fill.style.width = `${Number(csb.deliveries || 0) * 100 / max}%`; });
            const meta = tsElement('span', 'ts-csb-meta',
                [csb.district, `${tsDecimal(csb.kg, 0)} kg`, csb.distance_km ? `${tsInt(csb.distance_km)} km` : '', csb.avg_minutes ? tsDuration(csb.avg_minutes) : '']
                    .filter(Boolean).join(' · '));
            body.append(head, meter, meta);
            item.append(rank, body);
            list.append(item);
        });
        const more = $('technical-csbs-more');
        more.hidden = csbs.length <= TECHNICAL_CSB_LIMIT;
        more.textContent = technicalCsbsAll ? 'Réduire la liste' : `Voir les ${tsInt(csbs.length)} CSB`;
    }

    function toggleTechnicalCsbs() {
        technicalCsbsAll = !technicalCsbsAll;
        if (technicalData) renderTechnicalCsbs(technicalData.csbs || [], technicalPortColors(technicalData.ports || []));
    }

    // ---------- Carte (Leaflet, chargé à la demande) ----------
    function loadLeaflet() {
        if (window.L?.map) return Promise.resolve(window.L);
        if (!document.head) return Promise.reject(new Error('Carte indisponible dans ce navigateur.'));
        if (!leafletLoading) {
            leafletLoading = new Promise((resolve, reject) => {
                const style = document.createElement('link');
                style.rel = 'stylesheet';
                style.href = 'leaflet.css';
                const script = document.createElement('script');
                script.src = 'leaflet.js';
                script.onload = () => window.L?.map ? resolve(window.L) : reject(new Error('Bibliothèque de carte invalide.'));
                script.onerror = () => { leafletLoading = null; reject(new Error('Bibliothèque de carte non chargée (hors ligne ?).')); };
                document.head.append(style, script);
            });
        }
        return leafletLoading;
    }

    function technicalPopup(title, lines) {
        const box = tsElement('div', 'ts-popup');
        box.append(tsElement('strong', '', title));
        for (const line of lines.filter(Boolean)) box.append(tsElement('span', '', line));
        return box;
    }

    async function renderTechnicalMap(data, colors) {
        const status = $('technical-map-status');
        const ports = (data.ports || []).filter(port => port.latitude != null && port.longitude != null);
        const csbs = (data.csbs || []).filter(csb => csb.latitude != null && csb.longitude != null);
        if (!ports.length && !csbs.length) { status.textContent = 'Aucune coordonnée disponible pour la carte.'; return; }
        const sequence = technicalSequence;
        let L;
        try { L = await loadLeaflet(); } catch (error) { status.textContent = error.message; return; }
        if (sequence !== technicalSequence || activeView !== 'technical') return;
        const container = $('technical-map');
        if (!technicalMap) {
            technicalMap = L.map(container, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: true });
            technicalMapLayers = L.layerGroup().addTo(technicalMap);
        }
        // Fond de carte gratuit OpenStreetMap (sans clé, attribution obligatoire) ; le mode sombre est
        // obtenu par un filtre CSS sur les tuiles (technical-stats.css), sans autre fournisseur.
        if (!technicalTiles) {
            technicalTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18, className: 'ts-tiles',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>'
            }).addTo(technicalMap);
        }
        technicalMapLayers.clearLayers();
        const portById = new Map(ports.map(port => [port.id, port]));
        const max = Math.max(...csbs.map(csb => Number(csb.deliveries || 0)), 1);
        const points = [];
        // Routes drone port → CSB (pointillés animés), épaisseur selon le nombre de livraisons.
        for (const csb of csbs) {
            const port = portById.get(csb.port_id);
            if (!port) continue;
            L.polyline([[port.latitude, port.longitude], [csb.latitude, csb.longitude]], {
                color: colors.get(port.id), weight: 1.5 + 3 * Number(csb.deliveries) / max, opacity: 0.7,
                dashArray: '6 9', className: 'ts-route', interactive: false
            }).addTo(technicalMapLayers);
        }
        for (const csb of csbs) {
            const color = colors.get(csb.port_id) || '#64748b';
            L.circleMarker([csb.latitude, csb.longitude], {
                radius: 5 + 11 * Math.sqrt(Number(csb.deliveries || 0) / max), color: '#ffffff', weight: 2,
                fillColor: color, fillOpacity: 0.9, className: 'ts-csb-dot'
            }).bindTooltip(`${csb.name} · ${tsInt(csb.deliveries)} livraison(s) réussie(s)`, { direction: 'top', offset: [0, -6] })
                .bindPopup(technicalPopup(csb.name, [
                    [csb.category, csb.district].filter(Boolean).join(' · '),
                    `${tsInt(csb.deliveries)} livraison(s) réussie(s) · ${tsDecimal(csb.kg, 1)} kg`,
                    csb.distance_km ? `Distance du vol : ${tsInt(csb.distance_km)} km` : '',
                    csb.avg_minutes ? `Durée moyenne : ${tsDuration(csb.avg_minutes)}` : '',
                    csb.last_day ? `Dernière livraison : ${dsDate(csb.last_day)}` : '',
                    `Depuis ${csb.port_name || 'le drone port'}`
                ]))
                .addTo(technicalMapLayers);
            points.push([csb.latitude, csb.longitude]);
        }
        for (const port of ports) {
            const color = colors.get(port.id);
            const icon = L.divIcon({
                className: 'ts-port-pin', iconSize: [38, 38], iconAnchor: [19, 19],
                html: `<span class="ts-pin-pulse" style="--c:${color}"></span><span class="ts-pin-pulse ts-pin-pulse-2" style="--c:${color}"></span><span class="ts-pin-core" style="--c:${color}"><i class="ph ph-drone"></i></span>`
            });
            L.marker([port.latitude, port.longitude], { icon, zIndexOffset: 1000, title: port.name })
                .bindPopup(technicalPopup(port.name, [
                    port.first_ever ? `En service depuis le ${dsDate(port.first_ever)}` : '',
                    `${tsInt(port.deliveries)} livraison(s) réussie(s) sur la période · ${tsHours(port.minutes)} h`,
                    `${tsInt(port.km)} km · ${tsDecimal(port.kg, 0)} kg livrés · ${tsInt(port.csbs)} CSB`
                ]))
                .addTo(technicalMapLayers);
            points.push([port.latitude, port.longitude]);
        }
        const hidden = (data.csbs || []).length - csbs.length;
        status.textContent = hidden > 0 ? `${tsInt(hidden)} CSB sans coordonnées ne figurent pas sur la carte.` : '';
        setTimeout(() => {
            technicalMap.invalidateSize();
            if (points.length) technicalMap.fitBounds(points, { padding: [36, 36], maxZoom: 11 });
        }, 60);
    }

    function focusTechnicalPort(port) {
        if (!technicalMap || port.latitude == null || port.longitude == null) return;
        technicalMap.flyTo([port.latitude, port.longitude], 10, { duration: 1.2 });
        $('technical-map').scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
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
        const count = $('dash-missions-count'), more = $('dash-missions-more');
        count.hidden = !flights.length;
        count.textContent = String(data.flights ?? flights.length);
        more.hidden = !(data.flights > flights.length);
        more.textContent = `${flights.length} colis les plus récents affichés sur ${data.flights}.`;
        if (!flights.length) {
            addLine(container, 'Aucun colis en cours de livraison pour ce port.');
            return;
        }
        for (const flight of flights) {
            // Carte en colonne : elle reste lisible même quand la carte du tableau de bord est étroite.
            const card = document.createElement('div');
            card.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 min-w-0';
            const heading = document.createElement('div');
            heading.className = 'flex items-center gap-2 min-w-0';
            const bl = document.createElement('span');
            bl.className = 'font-mono font-bold text-xs text-slate-900 truncate min-w-0';
            bl.textContent = flight.bl;
            bl.title = flight.bl;
            const status = document.createElement('span');
            status.className = 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 text-cyan-800 shrink-0 whitespace-nowrap';
            status.textContent = 'En vol';
            status.title = 'En cours de livraison';
            heading.append(bl, status);
            const destination = document.createElement('div');
            destination.className = 'text-xs font-semibold text-slate-800 flex items-start gap-1 min-w-0';
            const mapPin = document.createElement('i');
            mapPin.className = 'ph ph-map-pin text-slate-400 mt-0.5 shrink-0';
            mapPin.setAttribute('aria-hidden', 'true');
            const destinationName = document.createElement('span');
            destinationName.className = 'min-w-0 break-words';
            destinationName.textContent = `${flight.csb} · planning ${flight.planning}`;
            destination.append(mapPin, destinationName);
            const cargo = document.createElement('ul');
            cargo.className = 'text-[11px] text-slate-500 font-mono space-y-0.5';
            for (const line of items(flight.items || [])) {
                const entry = document.createElement('li');
                entry.className = 'break-words';
                entry.textContent = line;
                cargo.append(entry);
            }
            card.append(heading, destination, cargo);
            if (flight.id && hasRole(['admin', 'pilot'])) {
                const close = document.createElement('button');
                close.type = 'button';
                close.className = 'ml-auto px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shrink-0';
                close.textContent = 'Clôturer';
                close.setAttribute('aria-label', `Clôturer le vol ${flight.bl}`);
                close.addEventListener('click', () => openDeliveryClose('drones', flight.id, 'close', 'dashboard'));
                heading.append(close);
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

    // Date du jour à Madagascar (AAAA-MM-JJ), et même date décalée de `months` mois (fin de mois bornée, comme PostgreSQL).
    function madagascarDate(months = 0) {
        const [year, month, day] = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Indian/Antananarivo' })
            .format(new Date()).split('-').map(Number);
        const target = new Date(Date.UTC(year, month - 1 + months, 1));
        const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
        target.setUTCDate(Math.min(day, lastDay));
        return target.toISOString().slice(0, 10);
    }

    function dashboardChip(text, tone) {
        const chip = document.createElement('span');
        chip.className = `px-2 py-0.5 rounded-full font-bold ${tone}`;
        chip.textContent = text;
        return chip;
    }

    // Synthèse péremption (tous les lots, pas seulement les 4 affichés) et alertes de seuil minimum,
    // calculées à partir des lots déjà chargés pour le graphique des stocks.
    function renderDashboardStockAlerts(stocks, consumption = null) {
        const today = madagascarDate(), limit = madagascarDate(3);
        const dated = stocks.filter(stock => stock.expiry_date && BigInt(stock.quantity) > 0n);
        const expired = dated.filter(stock => stock.expiry_date < today);
        const soon = dated.filter(stock => stock.expiry_date >= today && stock.expiry_date <= limit);
        const summary = $('dash-expiry-summary');
        summary.replaceChildren();
        if (expired.length || soon.length) {
            if (expired.length) summary.append(dashboardChip(`${expired.length} lot(s) périmé(s)`, 'bg-red-100 text-red-700'));
            if (soon.length) summary.append(dashboardChip(`${soon.length} lot(s) périmant d’ici 3 mois`, 'bg-amber-100 text-amber-800'));
            if (expired.length && hasRole(['admin', 'logistics'])) {
                const action = document.createElement('button');
                action.type = 'button';
                action.className = 'ml-auto font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1';
                action.textContent = 'Isoler en quarantaine';
                const arrow = document.createElement('i');
                arrow.className = 'ph ph-arrow-right';
                arrow.setAttribute('aria-hidden', 'true');
                action.append(arrow);
                action.addEventListener('click', () => selectView('quarantine'));
                summary.append(action);
            }
        }
        summary.hidden = !summary.children.length;

        const totals = new Map();
        for (const stock of stocks) {
            const total = totals.get(stock.product_id) || { id:stock.product_id, name:stock.name, unit:stock.unit, threshold:BigInt(stock.min_threshold), available:0n };
            total.available += BigInt(stock.quantity) - BigInt(stock.reserved);
            totals.set(stock.product_id, total);
        }
        const products = [...totals.values()];
        for (const product of products) Object.assign(product, stockCoverage(product.available, consumption?.get(product.id)));
        // À réapprovisionner : sous le seuil minimum, ou moins d'un mois de consommation disponible.
        const low = products.filter(product => (product.threshold > 0n && product.available < product.threshold) ||
                (product.cmm > 0 && product.months < 1))
            // Les plus critiques d'abord : plus petit rapport disponible / seuil ou mois de stock.
            .sort((a, b) => urgency(a) - urgency(b) || a.name.localeCompare(b.name, 'fr'));
        const withoutThreshold = products.filter(product => product.threshold <= 0n).length;
        const list = $('dash-low-stock-list');
        list.replaceChildren();
        $('dash-low-stock-count').hidden = !low.length;
        $('dash-low-stock-count').textContent = String(low.length);
        if (!low.length) addLine(list, products.length ? 'Aucun intrant à réapprovisionner.' : 'Aucun intrant en stock pour ce port.');
        for (const product of low) {
            const empty = product.available <= 0n;
            const underThreshold = product.threshold > 0n && product.available < product.threshold;
            const row = document.createElement('div');
            row.className = 'p-3 flex items-center justify-between gap-3';
            const info = document.createElement('div');
            info.className = 'min-w-0';
            const name = document.createElement('div');
            name.className = 'text-xs font-bold text-slate-900 truncate';
            name.textContent = product.name;
            name.title = product.name;
            const detail = document.createElement('div');
            detail.className = 'text-[11px] text-slate-500 font-mono';
            detail.textContent = `Disponible : ${number(product.available)} ${product.unit} · Seuil : ${number(product.threshold)}${coverageText(product, consumption)}`;
            info.append(name, detail);
            const order = suggestedOrder(product);
            if (order > 0n) {
                const suggestion = document.createElement('div');
                suggestion.className = 'text-[11px] font-semibold text-slate-700';
                suggestion.textContent = `À commander : ${number(order)} ${product.unit}${product.cmm > 0 ? ` (objectif ${PLANNING_CMM_MONTHS} mois de consommation)` : ' (retour au seuil)'}`;
                info.append(suggestion);
            }
            const badge = document.createElement('span');
            badge.className = `shrink-0 px-2.5 py-1 rounded border font-mono font-bold text-[11px] ${empty ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`;
            badge.textContent = empty ? 'Rupture' : underThreshold ? `Manque ${number(product.threshold - product.available)}` : '< 1 mois';
            badge.title = underThreshold ? 'Quantité manquante pour revenir au seuil minimum' : 'Moins d’un mois de consommation disponible';
            row.append(info, badge);
            list.append(row);
        }
        if (withoutThreshold) {
            const note = document.createElement('p');
            note.className = 'px-3 py-2 text-[10px] text-slate-500';
            note.textContent = `${withoutThreshold} intrant(s) sans seuil défini : renseignez le seuil dans le référentiel des intrants.`;
            list.append(note);
        }
    }

    // Couverture d'un stock disponible (BigInt) par la consommation mensuelle moyenne (texte SQL, null si inconnue).
    function stockCoverage(available, cmmText) {
        const cmm = cmmText === null || cmmText === undefined ? null : Number(cmmText);
        return { cmm, months: cmm > 0 ? Number(available) / cmm : null };
    }

    function decimal(value) {
        return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    }

    function coverageText(product, consumption) {
        if (!consumption) return '';
        if (product.cmm === null) return ' · CMM : historique insuffisant';
        if (product.cmm === 0) return ' · CMM : 0 (aucune sortie sur 3 mois)';
        return ` · CMM : ${decimal(product.cmm)} · ${decimal(Math.max(product.months, 0))} mois`;
    }

    // Quantité suggérée : revenir au seuil, ou à l'objectif de mois de consommation s'il est plus élevé.
    function suggestedOrder(product) {
        const toThreshold = product.threshold - product.available;
        const toTarget = product.cmm > 0 ? BigInt(Math.ceil(product.cmm * PLANNING_CMM_MONTHS)) - product.available : 0n;
        const order = toThreshold > toTarget ? toThreshold : toTarget;
        return order > 0n ? order : 0n;
    }

    function urgency(product) {
        const ratios = [];
        if (product.threshold > 0n) ratios.push(Number(product.available) / Number(product.threshold));
        if (product.cmm > 0) ratios.push(product.months);
        return ratios.length ? Math.min(...ratios) : Infinity;
    }

    // Boutons « Exporter CSV » : exportent le tableau tel qu'il est affiché (recherche comprise).
    function installCsvExports() {
        const exports = [
            ['postgres-stocks-refresh', 'stocks-table-body', 'stocks-lots', true],
            ['postgres-salama-refresh', 'salama-table-body', 'receptions', true],
            ['postgres-products-refresh', 'catalog-table-body', 'referentiel-intrants', false],
            ['postgres-csb-refresh', 'csb-table-body', 'csb', true],
            ['postgres-ports-refresh', 'ports-table-body', 'magasins', false],
            ['sortie-new', 'sorties-table-body', 'expeditions-terrestres', true],
            ['delete-missing-csb-history', 'history-table-body', 'historique-vols', true]
        ];
        for (const [anchorId, bodyId, name, perSite] of exports) {
            const anchor = $(anchorId);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center';
            const icon = document.createElement('i');
            icon.className = 'ph ph-file-csv mr-1.5 text-emerald-600';
            icon.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.textContent = 'Exporter CSV';
            button.append(icon, label);
            button.title = 'Télécharger le tableau affiché au format CSV (Excel)';
            button.addEventListener('click', () => {
                const site = perSite ? portSelect.selectedOptions[0]?.textContent : '';
                downloadTableCsv($(bodyId).closest('table'), tableCsvFileName(name, site));
            });
            if (anchor.parentElement?.classList.contains('justify-between')) {
                // Bouton seul dans l'en-tête : le regrouper avec l'export pour garder la mise en page.
                const group = document.createElement('div');
                group.className = 'flex items-center gap-2';
                anchor.replaceWith(group);
                group.append(button, anchor);
            } else anchor.before(button);
        }
    }

    function renderDashboardStockChart(stocks, consumption = null) {
        renderDashboardStockAlerts(stocks, consumption);
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
        clearDashboardValidation();
        setText('active-port-badge', portSelect.selectedOptions[0]?.textContent || 'Aucun port');
        $('postgres-dashboard-status').textContent = port ? 'Chargement du tableau de bord…' : 'Aucun port disponible.';
        if (!port) return;
        try {
            const result = await api('/rest/v1/rpc/qbox_dashboard_details', { selected_port: port }, true);
            if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
            renderDashboard(result);
            // Circuit de validation des plannings : tuile en arrière-plan (10-planning-validation.js).
            loadDashboardValidation(port, seq, requestGeneration);
            try {
                const stocks = await api('/rest/v1/rpc/qbox_dashboard_stock_chart_exact', {selected_port:port}, true);
                if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
                // CMM facultative : sans elle, les alertes restent fondées sur le seuil minimum.
                let consumption = null;
                try {
                    const rows = await api('/rest/v1/rpc/qbox_site_consumption', {selected_port:port}, true);
                    consumption = new Map(rows.map(row => [row.product_id, row.cmm]));
                } catch { /* consommation indisponible */ }
                if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
                renderDashboardStockChart(stocks, consumption);
            } catch (error) {
                if (seq !== requestSequence || activeView !== 'dashboard' || port !== portSelect.value || sessionGeneration !== requestGeneration || !token) return;
                $('stock-chart-scroll').classList.add('hidden');
                $('stock-chart-details').classList.add('hidden');
                $('stock-chart-message').textContent = `Graphique des stocks indisponible : ${error.message}`;
                $('stock-chart-message').classList.remove('hidden');
                $('dash-low-stock-list').replaceChildren();
                addLine($('dash-low-stock-list'), `Alertes de seuil indisponibles : ${error.message}`);
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

    // ---------- Vue nationale (admin, logistique, UNFPA) — style : national-view.css ----------
    // Bandeau de supervision (santé du réseau, indicateurs), cartes de site, carte de chaleur
    // intrants × sites (mois de stock) et rééquilibrage suggéré entre magasin et drone ports.
    let nationalSequence = 0;
    let nationalData = null;
    let nationalFilter = { query: '', alertsOnly: false };
    // Transfert suggéré à pré-remplir à l'ouverture de l'écran Transferts (voir refreshTransfers).
    let pendingTransferSuggestion = null;
    const NATIONAL_ROLES = ['admin', 'logistics', 'unfpa'];
    const LEVEL_LABELS = { stockout: 'Rupture', low: 'Sous le seuil', watch: 'À surveiller', good: 'Correct', unknown: 'Seuil non défini' };

    function nationalElement(tag, className = '', text = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function nationalIcon(name) {
        const icon = nationalElement('i', `ph ${name}`);
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function nationalLevel(available, threshold) {
        if (threshold <= 0n) return 'unknown';
        if (available <= 0n) return 'stockout';
        if (available < threshold) return 'low';
        return available * 2n <= threshold * 3n ? 'watch' : 'good';
    }

    // Rééquilibrage glouton : les plus gros besoins sont servis par les plus gros excédents,
    // uniquement entre sites de types différents (magasin de stockage ↔ drone port), comme les transferts.
    function nationalTransferSuggestions(data) {
        const suggestions = [];
        const sites = new Map((data.sites || []).map(site => [site.id, site]));
        for (const product of data.products || []) {
            const threshold = BigInt(product.min_threshold);
            if (threshold <= 0n) continue;
            const needs = [], surpluses = [];
            const keep = (threshold * 3n + 1n) / 2n; // 1,5 × seuil, arrondi au supérieur
            for (const cell of product.cells || []) {
                const available = BigInt(cell.available);
                if (available < threshold) needs.push({ port: cell.port_id, quantity: threshold - available });
                if (available > keep) surpluses.push({ port: cell.port_id, quantity: available - keep });
            }
            const byQuantity = (a, b) => a.quantity < b.quantity ? 1 : a.quantity > b.quantity ? -1 : 0;
            needs.sort(byQuantity);
            surpluses.sort(byQuantity);
            for (const need of needs) {
                for (const surplus of surpluses) {
                    if (need.quantity <= 0n) break;
                    const from = sites.get(surplus.port), to = sites.get(need.port);
                    if (surplus.quantity <= 0n || !from || !to || from.site_type === to.site_type) continue;
                    const quantity = need.quantity < surplus.quantity ? need.quantity : surplus.quantity;
                    need.quantity -= quantity;
                    surplus.quantity -= quantity;
                    suggestions.push({ product, from, to, quantity });
                }
            }
        }
        return suggestions;
    }

    // Niveau de chaque couple intrant × site, et répartition par site.
    function nationalLevels(data) {
        const perSite = new Map((data.sites || []).map(site => [site.id, { stockout: 0, low: 0, watch: 0, good: 0, unknown: 0 }]));
        const cells = [];
        for (const product of data.products || []) {
            const threshold = BigInt(product.min_threshold);
            for (const cell of product.cells || []) {
                const level = nationalLevel(BigInt(cell.available), threshold);
                perSite.get(cell.port_id) && perSite.get(cell.port_id)[level]++;
                cells.push(level);
            }
        }
        return { perSite, cells };
    }

    function clearNationalView() {
        nationalSequence++;
        nationalData = null;
        for (const id of ['national-kpis', 'national-sites', 'national-matrix-head', 'national-matrix-body', 'national-transfers']) $(id).replaceChildren();
        $('national-status').textContent = '';
        $('national-export').disabled = true;
    }

    async function refreshNationalView() {
        clearNationalView();
        if (!hasRole(NATIONAL_ROLES)) {
            $('national-status').textContent = 'Vous ne disposez pas des autorisations nécessaires.';
            return;
        }
        const sequence = nationalSequence, requestGeneration = sessionGeneration;
        $('national-status').textContent = 'Chargement de la vue nationale…';
        try {
            const data = await api('/rest/v1/rpc/qbox_national_overview', {}, true);
            if (sequence !== nationalSequence || activeView !== 'national' || sessionGeneration !== requestGeneration) return;
            nationalData = data;
            renderNationalView(data);
            $('national-status').textContent = `Actualisé le ${localDateTime(data.generated_at)} (heure de Madagascar).`;
        } catch (error) {
            if (sequence === nationalSequence && activeView === 'national' && sessionGeneration === requestGeneration)
                $('national-status').textContent = `Vue nationale indisponible : ${error.message}`;
        }
    }

    function renderNationalKpis(data, levels) {
        const sites = data.sites || [];
        const sum = key => sites.reduce((total, site) => total + Number(site[key] || 0), 0);
        const rated = levels.cells.filter(level => level !== 'unknown');
        const health = rated.length ? Math.round(rated.filter(level => level === 'good' || level === 'watch').length * 100 / rated.length) : null;
        const kpis = $('national-kpis');
        const ringTile = nationalElement('div', 'nv-ring-tile');
        const ring = nationalElement('div', 'nv-ring');
        ring.setAttribute('role', 'img');
        ring.setAttribute('aria-label', health === null ? 'Santé du réseau indisponible' : `Santé du réseau : ${health} %`);
        ring.dataset.label = health === null ? '—' : `${health} %`;
        // Départ à 0 puis valeur réelle : l'anneau se remplit à l'affichage.
        ring.style.setProperty?.('--p', '0');
        requestAnimationFrameSafe(() => ring.style.setProperty?.('--p', String(health ?? 0)));
        const ringText = nationalElement('div');
        ringText.append(nationalElement('strong', '', 'Santé du réseau'),
            nationalElement('span', '', 'Part des couples intrant × site au-dessus du seuil minimum.'));
        ringTile.append(ring, ringText);
        kpis.append(ringTile);
        for (const [label, icon, value, hint, tone] of [
            ['Sites suivis', 'ph-globe-hemisphere-east', sites.length, `${sites.filter(site => site.site_type === 'storage').length} magasin(s) · ${sites.filter(site => site.site_type !== 'storage').length} drone port(s)`, ''],
            ['Ruptures', 'ph-warning-octagon', sum('stockouts'), 'Intrants à zéro sur un site', sum('stockouts') ? 'nv-alert' : ''],
            ['Sous le seuil', 'ph-trend-down', sum('below_threshold'), 'Ruptures comprises', sum('below_threshold') ? 'nv-warn' : ''],
            ['Lots périmés', 'ph-calendar-x', sum('expired_lots'), `${sum('expiring_lots')} autre(s) sous 3 mois`, sum('expired_lots') ? 'nv-alert' : ''],
            // CAP livrés aux CSB depuis le 1er janvier (estimation, détail dans l'écran Statistiques).
            ['CAP livrés', 'ph-shield-check', nationalCyp(data.cyp_year),
                `aux CSB depuis le ${data.cyp_year_start ? String(data.cyp_year_start).slice(8, 10) + '/' + String(data.cyp_year_start).slice(5, 7) + '/' + String(data.cyp_year_start).slice(0, 4) : '1er janvier'} (estimation)`, 'nv-good']
        ]) {
            const tile = nationalElement('div', `nv-kpi ${tone}`.trim());
            const head = nationalElement('span', 'nv-kpi-label');
            head.append(nationalIcon(icon), document.createTextNode?.(label) || nationalElement('span', '', label));
            tile.append(head, nationalElement('span', 'nv-kpi-value', String(value)), nationalElement('span', 'nv-kpi-hint', hint));
            kpis.append(tile);
        }
    }

    // CAP (Couples-Année de Protection) : nombre arrondi à l'unité, séparateurs français.
    function nationalCyp(value) {
        return Math.round(Number(value || 0)).toLocaleString('fr-FR');
    }

    function requestAnimationFrameSafe(callback) {
        if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(() => window.requestAnimationFrame(callback));
        else callback();
    }

    function renderNationalSites(data, levels) {
        const cards = $('national-sites');
        const sites = data.sites || [];
        if (!sites.length) cards.append(nationalElement('p', 'nv-empty', 'Aucun site enregistré.'));
        for (const [index, site] of sites.entries()) {
            const tone = site.stockouts > 0 || site.expired_lots > 0 ? 'danger' : site.below_threshold > 0 ? 'warn' : 'ok';
            const card = nationalElement('button', `nv-site nv-tone-${tone}`);
            card.type = 'button';
            card.style.setProperty?.('--i', String(index));
            card.title = `Ouvrir le tableau de bord de ${site.name}`;
            const head = nationalElement('div', 'nv-site-head');
            const icon = nationalElement('span', 'nv-site-icon');
            icon.append(nationalIcon(site.site_type === 'storage' ? 'ph-warehouse' : 'ph-drone'));
            const name = nationalElement('div', 'nv-site-name');
            name.append(nationalElement('strong', '', site.name),
                nationalElement('span', '', `${site.region} · ${site.site_type === 'storage' ? 'Magasin de stockage' : 'Drone port'}`));
            const status = site.stockouts > 0 ? `${site.stockouts} rupture(s)` : site.below_threshold > 0 ? `${site.below_threshold} sous le seuil` : 'Stock correct';
            head.append(icon, name);

            const figure = nationalElement('div', 'nv-site-figure');
            figure.append(nationalElement('strong', '', number(site.available)), nationalElement('span', '', 'disponibles'),
                nationalElement('span', 'nv-pill', status));

            const counts = levels.perSite.get(site.id) || {};
            const health = nationalElement('div', 'nv-health');
            health.setAttribute('role', 'img');
            const parts = ['stockout', 'low', 'watch', 'good', 'unknown'].filter(level => counts[level] > 0);
            health.setAttribute('aria-label', parts.map(level => `${counts[level]} ${LEVEL_LABELS[level].toLowerCase()}`).join(', ') || 'Aucun intrant');
            for (const level of parts) {
                const segment = nationalElement('span', `nv-seg-${level}`);
                segment.style.flexGrow = String(counts[level]);
                segment.title = `${LEVEL_LABELS[level]} : ${counts[level]} intrant(s)`;
                health.append(segment);
            }
            const legend = nationalElement('div', 'nv-health-legend');
            for (const level of parts) {
                const entry = nationalElement('span');
                entry.append(nationalElement('i', `nv-dot nv-seg-${level}`), nationalElement('b', '', String(counts[level])),
                    nationalElement('span', '', ` ${LEVEL_LABELS[level].toLowerCase()}`));
                legend.append(entry);
            }
            if (!parts.length) legend.append(nationalElement('span', '', 'Aucun intrant stocké'));

            const facts = nationalElement('ul', 'nv-facts');
            for (const [icon, value, label, hot] of [
                ['ph-calendar-x', site.expired_lots, 'périmé(s)', site.expired_lots > 0],
                ['ph-hourglass-medium', site.expiring_lots, '< 3 mois', false],
                ['ph-airplane-tilt', site.flights_in_progress, 'vol(s)', false],
                ['ph-truck', site.shipments_in_progress, 'expédition(s)', false]
            ]) {
                const fact = nationalElement('li', hot ? 'nv-hot' : '');
                fact.title = { 'ph-calendar-x': 'Lots périmés encore en stock', 'ph-hourglass-medium': 'Lots qui périment dans les 3 mois', 'ph-airplane-tilt': 'Vols en cours', 'ph-truck': 'Expéditions terrestres en cours' }[icon];
                fact.append(nationalIcon(icon), nationalElement('b', '', String(value)), nationalElement('span', '', label));
                facts.append(fact);
            }
            if (site.site_type !== 'storage') {
                const cyp = nationalElement('li', 'nv-cyp');
                cyp.title = 'Couples-Année de Protection livrés aux CSB depuis le 1er janvier (estimation)';
                cyp.append(nationalIcon('ph-shield-check'), nationalElement('b', '', nationalCyp(site.cyp_year)), nationalElement('span', '', 'CAP livrés cette année'));
                facts.append(cyp);
            }
            const open = nationalElement('span', 'nv-open', 'Ouvrir le tableau de bord');
            open.append(nationalIcon('ph-arrow-right'));
            card.append(head, figure, health, legend, facts, open);
            card.addEventListener('click', () => {
                if (![...portSelect.options].some(option => option.value === site.id)) return;
                portSelect.value = site.id;
                updateSiteNavigation();
                if (frameConnected) sendFrame({ type: 'qbox-set-port', port: site.id });
                selectView('dashboard');
            });
            cards.append(card);
        }
    }

    function renderNationalMatrix(data) {
        const sites = data.sites || [];
        const target = data.target_months || PLANNING_CMM_MONTHS;
        const head = $('national-matrix-head'), body = $('national-matrix-body');
        head.replaceChildren();
        body.replaceChildren();
        const headRow = nationalElement('tr');
        headRow.append(nationalElement('th', 'nv-sticky', 'Intrant'), nationalElement('th', 'nv-num', 'Seuil'));
        for (const site of sites) headRow.append(nationalElement('th', '', site.name));
        headRow.append(nationalElement('th', 'nv-num', 'Total disponible'));
        head.append(headRow);
        const query = nationalFilter.query.trim().toLocaleLowerCase('fr-FR');
        let shown = 0;
        for (const product of data.products || []) {
            const threshold = BigInt(product.min_threshold);
            const cells = new Map((product.cells || []).map(cell => [cell.port_id, cell]));
            const levels = [...cells.values()].map(cell => nationalLevel(BigInt(cell.available), threshold));
            if (query && !`${product.name} ${product.code}`.toLocaleLowerCase('fr-FR').includes(query)) continue;
            if (nationalFilter.alertsOnly && !levels.some(level => level === 'stockout' || level === 'low')) continue;
            shown++;
            const row = nationalElement('tr');
            const name = nationalElement('td', 'nv-sticky nv-product');
            name.append(nationalElement('strong', '', product.name), nationalElement('span', '', `${product.code} · ${product.unit}`));
            row.append(name, nationalElement('td', 'nv-num', threshold > 0n ? number(threshold) : '—'));
            let total = 0n;
            for (const site of sites) {
                const cell = cells.get(site.id);
                const td = nationalElement('td');
                if (!cell) {
                    const none = nationalElement('div', 'nv-cell nv-c-none', '—');
                    none.title = `${site.name} : jamais stocké sur ce site`;
                    td.append(none);
                } else {
                    const available = BigInt(cell.available);
                    total += available;
                    const level = nationalLevel(available, threshold);
                    const coverage = stockCoverage(available, cell.cmm);
                    const box = nationalElement('div', `nv-cell nv-c-${level}`);
                    box.append(nationalElement('span', 'nv-cell-value', number(available)),
                        nationalElement('span', 'nv-cell-months',
                            coverage.cmm === null ? 'CMM inconnue' : coverage.cmm === 0 ? 'aucune sortie' : `${decimal(Math.max(coverage.months, 0))} mois`));
                    if (coverage.months !== null) {
                        const gauge = nationalElement('span', 'nv-gauge');
                        const fill = nationalElement('i');
                        fill.style.width = `${Math.min(100, Math.max(0, coverage.months / target * 100))}%`;
                        gauge.append(fill);
                        box.append(gauge);
                    }
                    box.title = `${site.name} · ${LEVEL_LABELS[level]} · stock ${number(cell.stock)}, réservé ${number(cell.reserved)}` +
                        (coverage.cmm === null ? '' : ` · CMM ${decimal(coverage.cmm)} (objectif ${target} mois)`);
                    td.append(box);
                }
                row.append(td);
            }
            row.append(nationalElement('td', 'nv-num nv-product', number(total)));
            body.append(row);
        }
        if (!shown) {
            const row = nationalElement('tr');
            const cell = nationalElement('td', 'nv-empty',
                (data.products || []).length ? 'Aucun intrant ne correspond au filtre.' : 'Aucun intrant en stock.');
            cell.colSpan = sites.length + 3;
            row.append(cell);
            body.append(row);
        }
    }

    function renderNationalTransfers(data) {
        const container = $('national-transfers');
        container.replaceChildren();
        const suggestions = nationalTransferSuggestions(data);
        if (!suggestions.length) {
            const calm = nationalElement('div', 'nv-calm');
            calm.append(nationalIcon('ph-check-circle'),
                nationalElement('span', '', 'Aucun transfert suggéré : aucun site sous le seuil ne peut être complété par un site excédentaire d’un autre type.'));
            container.append(calm);
            return;
        }
        const canTransfer = hasRole(['admin', 'logistics']);
        for (const [index, suggestion] of suggestions.entries()) {
            const card = nationalElement('article', 'nv-route');
            card.style.setProperty?.('--i', String(index));
            const product = nationalElement('div', 'nv-route-product');
            product.append(nationalElement('strong', '', suggestion.product.name),
                nationalElement('span', 'nv-route-qty', `${number(suggestion.quantity)} ${suggestion.product.unit}`));
            const path = nationalElement('div', 'nv-route-path');
            const from = nationalElement('div', 'nv-stop');
            from.append(nationalElement('small', '', 'Depuis'), nationalElement('span', '', suggestion.from.name));
            const to = nationalElement('div', 'nv-stop nv-to');
            to.append(nationalElement('small', '', 'Vers'), nationalElement('span', '', suggestion.to.name));
            const arrow = nationalElement('span', 'nv-arrow');
            arrow.setAttribute('aria-hidden', 'true');
            path.append(from, arrow, to);
            card.append(product, path);
            if (canTransfer) {
                const prepare = nationalElement('button');
                prepare.type = 'button';
                prepare.append(nationalIcon('ph-truck'), nationalElement('span', '', 'Préparer ce transfert'));
                prepare.addEventListener('click', () => prepareNationalTransfer(suggestion));
                card.append(prepare);
            }
            container.append(card);
        }
    }

    function renderNationalView(data) {
        const levels = nationalLevels(data);
        for (const id of ['national-kpis', 'national-sites']) $(id).replaceChildren();
        renderNationalKpis(data, levels);
        renderNationalSites(data, levels);
        renderNationalMatrix(data);
        renderNationalTransfers(data);
        $('national-export').disabled = !(data.products || []).length;
    }

    function setNationalFilter(changes) {
        Object.assign(nationalFilter, changes);
        $('national-filter-all').setAttribute('aria-pressed', String(!nationalFilter.alertsOnly));
        $('national-filter-alerts').setAttribute('aria-pressed', String(nationalFilter.alertsOnly));
        if (nationalData) renderNationalMatrix(nationalData);
    }

    // Ouvre l'écran Transferts depuis le site excédentaire, destination choisie, lots répartis par FEFO.
    function prepareNationalTransfer(suggestion) {
        if (![...portSelect.options].some(option => option.value === suggestion.from.id)) return;
        pendingTransferSuggestion = { from: suggestion.from.id, to: suggestion.to.id, productId: suggestion.product.id,
            productName: suggestion.product.name, unit: suggestion.product.unit, quantity: suggestion.quantity, toName: suggestion.to.name };
        portSelect.value = suggestion.from.id;
        updateSiteNavigation();
        if (frameConnected) sendFrame({ type: 'qbox-set-port', port: suggestion.from.id });
        selectView('transfers');
    }

    // Appelée par refreshTransfers une fois le formulaire prêt : renvoie le message à afficher, ou null.
    function applyTransferSuggestion(port) {
        const suggestion = pendingTransferSuggestion;
        pendingTransferSuggestion = null;
        if (!suggestion || suggestion.from !== port) return null;
        const destination = $('transfer-destination');
        if (![...destination.options].some(option => option.value === suggestion.to)) return null;
        destination.value = suggestion.to;
        transferDestinationChanged();
        const lots = transferStocks.filter(lot => lot.product_id === suggestion.productId && BigInt(lot.available) > 0n)
            .sort((a, b) => String(a.expiry_date || '9999').localeCompare(String(b.expiry_date || '9999')));
        let remaining = suggestion.quantity, rows = 0;
        for (const lot of lots) {
            if (remaining <= 0n) break;
            const quantity = BigInt(lot.available) < remaining ? BigInt(lot.available) : remaining;
            addTransferItem();
            const row = $('transfer-items').children[$('transfer-items').children.length - 1];
            const [stock, input] = row.children;
            stock.value = lot.id;
            input.value = quantity.toString();
            remaining -= quantity;
            rows++;
        }
        if (!rows) return null;
        return `Transfert suggéré préparé : ${number(suggestion.quantity - remaining)} ${suggestion.unit} de ${suggestion.productName} vers ${suggestion.toName}` +
            ` (${rows} lot(s), péremption la plus proche d’abord). Vérifiez puis validez.`;
    }

    // CSV : deux colonnes par site (disponible, mois de stock) pour rester exploitable dans Excel.
    function nationalCsv(data) {
        const sites = data.sites || [];
        const header = ['Code', 'Intrant', 'Unité', 'Seuil', ...sites.flatMap(site => [`${site.name} disponible`, `${site.name} mois de stock`]), 'Total disponible'];
        const lines = (data.products || []).map(product => {
            const cells = new Map((product.cells || []).map(cell => [cell.port_id, cell]));
            let total = 0n;
            const values = sites.flatMap(site => {
                const cell = cells.get(site.id);
                if (!cell) return ['', ''];
                total += BigInt(cell.available);
                const coverage = stockCoverage(BigInt(cell.available), cell.cmm);
                return [cell.available, coverage.months === null ? '' : decimal(Math.max(coverage.months, 0))];
            });
            return [product.code, product.name, product.unit, product.min_threshold, ...values, total.toString()];
        });
        return '﻿' + [header, ...lines].map(row => row.map(historyCsvCell).join(';')).join('\r\n');
    }

    function exportNationalView() {
        if (!nationalData) return;
        const url = URL.createObjectURL(new Blob([nationalCsv(nationalData)], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = tableCsvFileName('vue-nationale', '');
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        if (isStorage() && ['planning', 'archives', 'stock-analysis', 'drones', 'history', 'sorties', 'csb'].includes(view)) view = 'dashboard';
        if (deliveryPrintDraft) { closeDeliveryPrint(); }
        if (planningPrintDraft) { closePlanningPrint(); }
        if (stockHistoryPrintOpen) { closeStockHistoryPrint(); }
        if (dashboardReportPort) { closePostgresDashboardReport(); }
        if (inventoryPrintDraft) { closeInventoryPrint(); }
        if (receiptId || productOpen || productSaving || csbOpen || csbSaving || portFormOpen || portSaving || planningDraft || archiveDraft || planningSaving || flightDraft || flightSaving || shipmentDraft || shipmentSaving || inventoryDraft || inventorySaving || quarantineDraft || quarantineSaving || deliveryCloseDraft || deliveryCloseSaving || deliveryEditDraft || deliveryEditSaving) {
            $(receiptId ? 'postgres-salama-form-status' : csbOpen ? 'postgres-csb-form-status' : (portFormOpen || portSaving) ? 'postgres-ports-status' : planningDraft ? 'postgres-plan-form-status' : archiveDraft ? 'postgres-archive-form-status' : flightDraft ? 'postgres-drone-form-status' : shipmentDraft ? 'postgres-sortie-form-status' : inventoryDraft ? 'postgres-inventory-status' : (quarantineDraft || quarantineSaving) ? 'postgres-quarantine-status' : deliveryCloseDraft ? 'postgres-close-delivery-status' : deliveryEditDraft ? 'delivery-edit-status' : 'postgres-product-form-status').textContent = 'Terminez ou annulez la saisie avant de changer de page.';
            return;
        }
        // Historique : registre des clôtures et sorties d'avant Q.box toujours repliés à l'ouverture de l'écran.
        if (view === 'history' && activeView !== 'history') collapseHistoryBlocks();
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
        if (dashboard) refreshDashboard(); else if (view === 'transfers') refreshTransfers(); else if (view === 'products') refreshCatalog(); else if (view === 'csb') refreshCsbs(); else if (view === 'ports') refreshPorts(); else if (['planning', 'archives'].includes(view)) refreshPlanCards(view); else if (view === 'stock-analysis') refreshStockAnalysis(); else if (['drones', 'history', 'sorties'].includes(view)) refreshDeliveries(view); else if (view === 'inventory') refreshInventories(); else if (view === 'quarantine') refreshQuarantines(); else if (view === 'stock-history') refreshStockHistory(); else if (view === 'logistics-report') refreshLogisticsReport(); else if (view === 'national') refreshNationalView(); else if (view === 'statistics') refreshDeliveryStats(); else if (view === 'technical') refreshTechnicalStats(); else if (native) refreshNativeView(view); else refreshReadView();
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
            if (isStorage() && ['planning', 'archives', 'stock-analysis', 'drones', 'history', 'sorties', 'csb'].includes(activeView)) {
                selectView('dashboard');
                return;
            }
            setText('active-port-badge', portSelect.selectedOptions[0]?.textContent || 'Aucun port');
            if (activeView === 'dashboard') refreshDashboard();
            else if (activeView === 'products') refreshCatalog();
            else if (activeView === 'csb') refreshCsbs();
            else if (activeView === 'ports') refreshPorts();
            else if (['planning', 'archives'].includes(activeView)) refreshPlanCards(activeView);
            else if (activeView === 'stock-analysis') refreshStockAnalysis();
            else if (['drones', 'history', 'sorties'].includes(activeView)) refreshDeliveries(activeView);
            else if (activeView === 'inventory') refreshInventories();
            else if (activeView === 'quarantine') refreshQuarantines();
            else if (activeView === 'stock-history') refreshStockHistory();
            else if (activeView === 'logistics-report') refreshLogisticsReport();
            else if (['stocks', 'salama'].includes(activeView)) refreshNativeView(activeView);
            else if (readViews[activeView]) refreshReadView();
        }
    });

    // ---------- Préférences d'alertes e-mail ----------
    let alertsGeneration = 0;

    async function openAlerts() {
        const generation = ++alertsGeneration, requestGeneration = sessionGeneration;
        $('alerts-form').reset();
        for (const id of ['alerts-weekly', 'alerts-stockout', 'alerts-reports', 'alerts-validations', 'alerts-operations', 'alerts-submit']) $(id).disabled = true;
        $('alerts-status').textContent = 'Chargement…';
        $('alerts-dialog').showModal();
        try {
            const [preferences] = await api('/rest/v1/rpc/qbox_my_alert_preferences', {}, true);
            if (generation !== alertsGeneration || requestGeneration !== sessionGeneration) return;
            $('alerts-weekly').checked = !!preferences?.weekly;
            $('alerts-stockout').checked = !!preferences?.stockout;
            $('alerts-reports').checked = !!preferences?.reports;
            $('alerts-validations').checked = preferences?.validations !== false;
            $('alerts-operations').checked = preferences?.operations !== false;
            for (const id of ['alerts-weekly', 'alerts-stockout', 'alerts-reports', 'alerts-validations', 'alerts-operations', 'alerts-submit']) $(id).disabled = false;
            $('alerts-status').textContent = preferences?.customized ? '' : 'Réglage par défaut selon votre rôle.';
        } catch (error) {
            if (generation === alertsGeneration) $('alerts-status').textContent = `Préférences indisponibles : ${error.message}`;
        }
    }

    async function submitAlerts(event) {
        event.preventDefault();
        const generation = alertsGeneration, requestGeneration = sessionGeneration;
        $('alerts-submit').disabled = true;
        $('alerts-status').textContent = 'Enregistrement…';
        try {
            await api('/rest/v1/rpc/qbox_set_alert_preferences', { weekly: $('alerts-weekly').checked, stockout: $('alerts-stockout').checked, reports: $('alerts-reports').checked, validations: $('alerts-validations').checked, operations: $('alerts-operations').checked }, true);
            if (generation !== alertsGeneration || requestGeneration !== sessionGeneration) return;
            $('alerts-status').textContent = 'Préférences enregistrées.';
        } catch (error) {
            if (generation === alertsGeneration) $('alerts-status').textContent = `Enregistrement impossible : ${error.message}`;
        } finally {
            if (generation === alertsGeneration) $('alerts-submit').disabled = false;
        }
    }

    function closeAlerts() {
        alertsGeneration++;
        if ($('alerts-dialog').open) $('alerts-dialog').close();
    }

    function setup() {
        $('postgres-signup-link').classList.remove('postgres-hidden');
        for (const id of ['legacy-header-actions', 'legacy-dashboard-report'])
            $(id).classList.add('postgres-hidden');
        $('legacy-new-flight').addEventListener('click', () => {
            selectView('drones');
            openFlights();
        });
        $('legacy-new-receipt').addEventListener('click', () => {
            selectView('salama');
            openReceipt();
        });
        for (const button of document.querySelectorAll('.nav-item')) {
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
        $('nav-stock-analysis').classList.remove('postgres-hidden');
        $('stock-analysis-refresh').addEventListener('click', refreshStockAnalysis);
        $('national-refresh').addEventListener('click', refreshNationalView);
        $('national-export').addEventListener('click', exportNationalView);
        $('national-search').addEventListener('input', () => setNationalFilter({ query: $('national-search').value }));
        $('national-filter-all').addEventListener('click', () => setNationalFilter({ alertsOnly: false }));
        $('national-filter-alerts').addEventListener('click', () => setNationalFilter({ alertsOnly: true }));
        $('indicators-export').addEventListener('click', exportPerformanceIndicators);
        // Historique : statistiques de livraison et sorties d'avant Q.box.
        $('delivery-stats-period').addEventListener('change', changeStatsPeriod);
        $('delivery-stats-from').addEventListener('change', changeStatsPeriod);
        $('delivery-stats-to').addEventListener('change', changeStatsPeriod);
        $('history-closed-from').addEventListener('change', changeHistoryClosedPeriod);
        $('history-closed-to').addEventListener('change', changeHistoryClosedPeriod);
        $('history-closed-clear').addEventListener('click', clearHistoryClosedPeriod);
        $('history-closed-district').addEventListener('change', changeHistoryClosedDistrict);
        // Statistiques techniques : période, liste des CSB, recopie manuelle (administrateurs).
        for (const preset of TECHNICAL_PRESETS)
            $(`technical-preset-${preset}`).addEventListener('click', () => selectTechnicalPreset(preset));
        $('technical-from').addEventListener('change', changeTechnicalDates);
        $('technical-to').addEventListener('change', changeTechnicalDates);
        $('technical-csbs-more').addEventListener('click', toggleTechnicalCsbs);
        $('technical-refresh').addEventListener('click', refreshTechnicalCopy);
        for (const preset of HISTORY_CLOSED_PRESETS)
            $(`history-closed-preset-${preset}`).addEventListener('click', () => selectHistoryClosedPreset(preset));
        $('history-closed-more').addEventListener('click', () => loadClosedFlights(false));
        for (const source of ['all', 'app', 'legacy']) $(`delivery-stats-source-${source}`).addEventListener('click', () => setDeliveryStatsSource(source));
        $('delivery-stats-export').addEventListener('click', exportDeliveryStats);
        $('delivery-stats-print').addEventListener('click', openDeliveryStatsPrint);
        $('stats-scope').addEventListener('change', refreshDeliveryStats);
        $('cyp-populations').addEventListener('click', openPopulations);
        for (const id of ['population-close', 'population-cancel']) $(id).addEventListener('click', closePopulations);
        $('population-form').addEventListener('submit', submitPopulations);
        for (const id of HISTORY_COLLAPSIBLES) $(`${id}-toggle`).addEventListener('click', () => toggleHistoryBlock(id));
        // Couples-Année de Protection livrés (05-couples-annee-protection.js).
        $('cyp-include-other').addEventListener('change', refreshCyp);
        for (const tab of ['products', 'districts', 'destinations']) $(`cyp-tab-${tab}`).addEventListener('click', () => setCypTab(tab));
        $('cyp-search').addEventListener('input', renderCypTable);
        $('cyp-export').addEventListener('click', exportCyp);
        $('cyp-print').addEventListener('click', openCypPrint);
        $('stats-print-confirm').addEventListener('click', printStats);
        $('stats-print-close').addEventListener('click', closeStatsPrint);
        $('legacy-deliveries-filters').addEventListener('submit', event => { event.preventDefault(); refreshLegacyDeliveries(true); });
        $('legacy-deliveries-more').addEventListener('click', () => refreshLegacyDeliveries(false));
        $('legacy-deliveries-export').addEventListener('click', exportLegacyDeliveries);
        $('product-gtin-scan').addEventListener('click', scanProductGtin);
        for (const id of ['salama-scan', 'salama-scan-mobile']) $(id).addEventListener('click', scanReceipt);
        $('inventory-scan').addEventListener('click', scanInventory);
        $('alerts-open').classList.remove('postgres-hidden');
        $('alerts-open').addEventListener('click', openAlerts);
        $('alerts-form').addEventListener('submit', submitAlerts);
        $('alerts-cancel').addEventListener('click', closeAlerts);
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
        setText('auth-network-status', 'Test local PostgreSQL');
        setText('auth-version', 'TEST LOCAL');
        setText('dashboard-live-label', 'Instantané');
        setText('dashboard-fefo-label', 'Lots datés par péremption');
        $('login-username').value = '';
        $('login-password').value = '';
        $('login-username').type = 'email';
        $('login-username').autocomplete = 'username';
        $('login-password').autocomplete = 'current-password';
        for (const id of ['stocks-receive', 'salama-receive', 'salama-close', 'salama-cancel', 'salama-add-row'])
        for (const id of ['stocks-receive', 'salama-receive']) $(id).addEventListener('click', openReceipt);
        for (const id of ['salama-close', 'salama-cancel']) $(id).addEventListener('click', closeReceipt);
        $('modal-backdrop').addEventListener('click', () => { if (productOpen) closeProduct(); else if (csbOpen) closeCsb(); else if (planningDraft) closePlanning(); else if (archiveDraft) closeArchive(); else if (flightDraft) closeFlights(); else if (shipmentDraft) closeShipment(); else if (deliveryCloseDraft) closeDeliveryModal(); else if (deliveryEditDraft) closeDeliveryEdit(); else if (deliveryPrintDraft) closeDeliveryPrint(); else if (planningPrintDraft) closePlanningPrint(); else if (stockHistoryPrintOpen) closeStockHistoryPrint(); else if (dashboardReportPort) closePostgresDashboardReport(); else if (inventoryPrintDraft) closeInventoryPrint(); else closeReceipt(); });
        $('salama-add-row').addEventListener('click', () => addReceiptRow(receiptProducts));
        $('salama-add-five').hidden = false;
        $('salama-add-five').addEventListener('click', () => addReceiptRows(5));
        $('salama-hint').hidden = false;
        // En-tête de colonnes unique au-dessus des lignes compactes.
        const receiptHead = $('salama-head');
        receiptHead.className = `${RECEIPT_GRID} px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400`;
        receiptHead.replaceChildren(...['#', 'Intrant', 'N° de lot', 'Péremption', 'Quantité', ''].map((text, index) => {
            const cell = document.createElement('span');
            cell.textContent = text;
            if (index === 0) cell.className = 'text-center';
            if (index === 4) cell.className = 'text-right';
            return cell;
        }));
        $('salama-form').addEventListener('submit', submitReceipt);
        $('stock-search').addEventListener('input', renderStocks);
        for (const id of ['postgres-stocks-status', 'postgres-salama-status', 'postgres-salama-form-status']) $(id).classList.remove('postgres-hidden');
        for (const id of ['postgres-stocks-refresh', 'postgres-salama-refresh']) {
            $(id).classList.remove('postgres-hidden');
            $(id).addEventListener('click', () => refreshNativeView(activeView));
        }
        $('stocks-print').classList.remove('postgres-hidden');
        $('stocks-print').addEventListener('click', openStockPrint);
        $('salama-id').maxLength = 150;
        setText('stocks-quantity-heading', 'Stock enregistré');
        setText('stocks-status-heading', 'Réservé / Disponible');
        setText('stocks-fefo-description', 'Lots classés par intrant et date de péremption ; le choix du lot reste manuel.');
        setText('salama-description', 'Chaque réception enregistrée est affichée séparément ; les références peuvent être identiques.');
        $('catalog-new').addEventListener('click', () => openProduct());
        for (const id of ['product-close', 'product-cancel']) $(id).addEventListener('click', closeProduct);
        $('form-product').addEventListener('submit', submitProduct);
        $('catalog-search').addEventListener('input', renderCatalog);
        $('postgres-products-refresh').addEventListener('click', refreshCatalog);
        for (const id of ['postgres-products-refresh', 'postgres-products-status', 'postgres-product-form-status']) $(id).classList.remove('postgres-hidden');
        $('product-name').maxLength = 150;
        $('product-unit').maxLength = 120;
        $('product-min-threshold').max = '9007199254740991';
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
        $('port-new').addEventListener('click', () => openPort());
        $('port-cancel').addEventListener('click', closePort);
        $('port-form').addEventListener('submit', submitPort);
        $('postgres-ports-refresh').addEventListener('click', refreshPorts);
        for (const id of ['postgres-ports-refresh', 'postgres-ports-status']) $(id).classList.remove('postgres-hidden');
        $('planning-new').addEventListener('click', () => openPlanning());
        $('planning-archive').addEventListener('click', openArchive);
        for (const id of ['planning-close', 'planning-cancel']) $(id).addEventListener('click', closePlanning);
        for (const id of ['archive-close', 'archive-cancel']) $(id).addEventListener('click', closeArchive);
        $('planning-add').addEventListener('click', togglePlanningBlocks);
        $('planning-add').className = 'px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-bold transition-colors';
        $('planning-add').textContent = 'Tout replier';
        $('plan-csb-picker').hidden = false;
        $('plan-csb-search').addEventListener('input', filterPlanningPicker);
        $('plan-csb-all').addEventListener('change', toggleAllPlanningCsbs);
        $('plan-csb-blocks').addEventListener('toggle', () => syncPlanningPicker(), true);
        $('planning-form-main').addEventListener('submit', submitPlanning);
        $('drones-search').addEventListener('input', filterDroneFlights);
        for (const id of ['plan-validation-close', 'plan-validation-cancel']) $(id).addEventListener('click', closePlanningValidation);
        $('plan-validation-return').addEventListener('click', () => submitPlanningValidation('return'));
        $('plan-validation-submit').addEventListener('click', () => submitPlanningValidation('validate'));
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
        $('drone-new').addEventListener('click', openFlights);
        for (const id of ['drone-close', 'drone-cancel']) $(id).addEventListener('click', closeFlights);
        $('drone-add').addEventListener('click', () => addFlightParcel());
        $('drone-hint').hidden = false;
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
            resetFlightParcels();
            if (flightDraft.target) addFlightParcel();
            updateFlightNeeds();
        });
        $('drone-form-main').addEventListener('submit', submitFlights);
        $('postgres-drone-form-status').classList.remove('postgres-hidden');
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
        $('quarantine-quantity').max = '9007199254740991';
        $('postgres-quarantine-new').addEventListener('click', openQuarantine);
        $('postgres-quarantine-refresh').addEventListener('click', refreshQuarantines);
        $('postgres-quarantine-cancel').addEventListener('click', closeQuarantine);
        $('quarantine-form-main').addEventListener('submit', submitQuarantine);
        for (const id of ['postgres-quarantine-status', 'postgres-quarantine-actions', 'postgres-quarantine-cancel']) $(id).classList.remove('postgres-hidden');
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
        $('postgres-stock-history-actions').classList.remove('postgres-hidden');
        $('postgres-stock-history-apply').addEventListener('click', () => refreshStockHistory());
        $('postgres-stock-history-more').addEventListener('click', () => refreshStockHistory(true));
        $('stock-history-at-date').addEventListener('change', () => refreshStockAtDate());
        $('stock-history-at-date-export').addEventListener('click', exportStockAtDate);
        $('stock-history-product').addEventListener('change', selectStockHistoryProduct);
        for (const id of ['stock-history-from', 'stock-history-to', 'stock-history-search'])
            $(id).addEventListener('keydown', event => { if (event.key === 'Enter') refreshStockHistory(); });
        $('stock-history-export').addEventListener('click', exportStockHistory);
        $('stock-history-print').addEventListener('click', openStockHistoryPrint);
        $('stock-history-print-confirm').addEventListener('click', () => {
            if (!stockHistoryPrintOpen) return;
            document.body.classList.add('stock-history-print-mode');
            window.print();
        });
        $('stock-history-print-close').addEventListener('click', closeStockHistoryPrint);
        for (const id of ['close-delivery-x', 'close-delivery-cancel']) {
            $(id).addEventListener('click', closeDeliveryModal);
        }
        $('close-delivery-form').addEventListener('submit', submitDeliveryClose);
        for (const id of ['postgres-close-delivery-detail', 'postgres-close-delivery-status']) $(id).classList.remove('postgres-hidden');
        for (const id of ['delivery-edit-close', 'delivery-edit-cancel']) $(id).addEventListener('click', closeDeliveryEdit);
        $('delivery-edit-add').addEventListener('click', () => { addDeliveryEditItem(); updateDeliveryEditNeeds(); });
        $('delivery-edit-form').addEventListener('submit', submitDeliveryEdit);
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
            document.body.classList.remove('stats-print-mode');
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
            if (isStorage() && ['planning', 'archives', 'stock-analysis', 'drones', 'history', 'statistics', 'sorties', 'csb'].includes(activeView)) {
                selectView('dashboard');
                return;
            }
            if (activeView === 'dashboard') refreshDashboard();
            else if (activeView === 'transfers') refreshTransfers();
            else if (activeView === 'products') refreshCatalog();
            else if (activeView === 'csb') refreshCsbs();
            else if (activeView === 'ports') refreshPorts();
            else if (['planning', 'archives'].includes(activeView)) refreshPlanCards(activeView);
            else if (activeView === 'stock-analysis') refreshStockAnalysis();
            else if (['drones', 'history', 'sorties'].includes(activeView)) refreshDeliveries(activeView);
            else if (activeView === 'inventory') refreshInventories();
            else if (activeView === 'quarantine') refreshQuarantines();
            else if (activeView === 'stock-history') refreshStockHistory();
            else if (activeView === 'logistics-report') refreshLogisticsReport();
            else if (activeView === 'national') return; // vue indépendante du site sélectionné
            else if (activeView === 'statistics') refreshDeliveryStats();
            else if (['stocks', 'salama'].includes(activeView)) refreshNativeView(activeView);
            else refreshReadView();
        });
        $('postgres-read-refresh').addEventListener('click', refreshReadView);
        $('postgres-read-manage').addEventListener('click', () => openOperations(operationSections[activeView]));
        $('legacy-dashboard-report').classList.remove('postgres-hidden');
        $('legacy-dashboard-report').addEventListener('click', openPostgresDashboardReport);
        $('legacy-stock-chart').classList.remove('postgres-hidden');
        $('postgres-dashboard-refresh').classList.remove('postgres-hidden');
        $('postgres-dashboard-refresh').addEventListener('click', refreshDashboard);
        $('dashboard-low-stock-card').classList.remove('postgres-hidden');
        installCsvExports();
        $('legacy-planning-link').classList.remove('postgres-hidden');
        $('legacy-planning-link').addEventListener('click', () => selectView('planning'));
        $('dashboard-report-close').addEventListener('click', closePostgresDashboardReport);
        $('dashboard-report-print').addEventListener('click', printPostgresDashboardReport);
        $('inventory-print-close').addEventListener('click', closeInventoryPrint);
        $('inventory-print-button').addEventListener('click', async () => {
            const draft = inventoryPrintDraft;
            if (!draft || draft.port !== portSelect.value) return;
            // Attendre le logo s'il n'est pas encore chargé, pour qu'il figure sur la page imprimée (impression maintenue en cas d'échec).
            const logo = $('inventory-print-report').querySelector('.inventory-report-logo');
            if (logo?.decode && !logo.complete) {
                try { await logo.decode(); } catch { /* logo indisponible */ }
                if (inventoryPrintDraft !== draft) return;
            }
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
                $('nav-national').classList.toggle('postgres-hidden', !hasRole(NATIONAL_ROLES));
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
