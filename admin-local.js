'use strict';

const $ = id => document.getElementById(id);
let config;
let token = null;
let sessionGeneration = 0;
let currentUser = null;
let passwordGeneration = 0;
let passwordSaving = false;
let nameSaving = false;
let editingUserName = null;
let usersRequest = 0;
let timer = null;
let geography = [];
let ports = [];
let csbs = [];
let editingPort = null;
let editingCsb = null;
let csbRequest = 0;
let categories = [];
let editingProduct = null;
let productRequest = 0;
let products = [];
let stockRequest = 0;
let historyRequest = 0;
let historyCursor = null;
let historyFilter = null;
let historyRows = [];
let receiptRequestId = null;
let receiptSaving = false;
let planningRequest = 0;
let editingPlanning = null;
let planningSaving = false;
let plans = [];
let stockLots = [];
let flightRequest = 0;
let flightSaving = false;
let flightEdit = null;
let flightEditRequest = 0;
let flightPrintRequest = 0;
let shipmentRequest = 0;
let shipmentSaving = false;
let shipmentId = null;
let shipmentEdit = null;
let shipmentEditRequest = 0;
let quarantineRequest = 0;
let inventoryRequest = 0;
let inventorySnapshotRequest = 0;
let quarantineSaving = false;
let quarantineLoading = false;
let inventorySaving = false;
let inventoryDraft = null;
let activePort = '';
let dashboardRequest = 0;
let dashboardReportRequest = 0;
const embedded = new URLSearchParams(location.search).get('embedded') === '1' && window.parent !== window;
const roles = { admin: 'Admin', pilot: 'Pilote', pilot_rd: 'Pilote RD', logistics: 'Coordinateur logistique', unfpa: 'UNFPA' };
const statuses = { pending: 'En attente', approved: 'Actif', suspended: 'Suspendu', rejected: 'Refusé' };

function message(text, error = false) {
    $('message').textContent = text;
    $('message').style.color = error ? '#b91c1c' : '#166534';
}

function madagascarDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Indian/Antananarivo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

function notifyEmbeddedPort() {
    if (embedded) window.parent.postMessage({
        type: 'qbox-port-changed', port: $('reference-port').value,
        ports: ports.map(port => ({ id: port.id, name: port.name, region: port.region }))
    }, location.origin);
}

async function request(path, body, authenticated = false, retried = false) {
    if (!config) throw new Error('Configuration locale indisponible.');
    const requestGeneration = sessionGeneration;
    const requestToken = authenticated ? token : null;
    const response = await fetch(config.url + path, {
        method: 'POST',
        headers: {
            apikey: config.key,
            'Content-Type': 'application/json',
            ...(authenticated ? { Authorization: `Bearer ${requestToken}` } : {})
        },
        body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => null);
    if (authenticated && requestGeneration !== sessionGeneration) throw new Error('Session remplacée.');
    if (!response.ok) {
        if (response.status === 401 && authenticated) {
            if (!retried && token && token !== requestToken) return request(path, body, authenticated, true);
            if (token === requestToken) {
                clearSession(false);
                if (embedded) window.parent.postMessage({ type: 'qbox-session-expired', token: requestToken }, location.origin);
            }
            throw new Error('Session expirée : reconnectez-vous.');
        }
        throw new Error(result?.message || result?.error_description || result?.msg || `Erreur serveur (${response.status}).`);
    }
    if (authenticated && /\/qbox_(stock_history|planning_history|list_inventories|list_quarantines|flight_details|shipment_details)$/.test(path)) {
        await enrichHistoryActors(path, result, actorIds =>
            request('/rest/v1/rpc/qbox_history_actor_names', {actor_ids: actorIds}, true));
        if (requestGeneration !== sessionGeneration) throw new Error('Session remplacée.');
    }
    return result;
}

function clearSession(notifyParent = true) {
    sessionGeneration++;
    nameSaving = false;
    editingUserName = null;
    usersRequest++;
    $('admin-name-submit').disabled = false;
    $('admin-name-cancel').disabled = false;
    $('admin-name-form').reset();
    $('admin-name-status').textContent = '';
    if ($('admin-name-dialog').open) $('admin-name-dialog').close();
    passwordGeneration++;
    passwordSaving = false;
    $('password-submit').disabled = false;
    $('password-form').reset();
    $('password-settings').open = false;
    if (embedded && token && notifyParent)
        window.parent.postMessage({ type: 'qbox-session-ended', token }, location.origin);
    token = null;
    currentUser = null;
    if (timer) clearInterval(timer);
    timer = null;
    $('session').hidden = true;
    $('authentication').hidden = false;
    $('administration').hidden = true;
    $('flight-test').hidden = true;
    $('users').replaceChildren();
    $('identity').textContent = '';
    geography = [];
    ports = [];
    csbs = [];
    categories = [];
    products = [];
    stockRequest++;
    dashboardRequest++;
    historyRequest++;
    historyCursor = null;
    historyFilter = null;
    historyRows = [];
    planningRequest++;
    flightRequest++;
    flightEditRequest++;
    flightEdit = null;
    shipmentRequest++;
    shipmentEditRequest++;
    shipmentEdit = null;
    quarantineRequest++;
    inventoryRequest++;
    inventorySnapshotRequest++;
    inventoryDraft = null;
    activePort = '';
    shipmentId = null;
    plans = [];
    stockLots = [];
    editingPlanning = null;
    receiptRequestId = null;
    editingProduct = null;
    productRequest++;
    editingPort = null;
    editingCsb = null;
    csbRequest++;
    $('reference-port-form').hidden = true;
    $('reference-csb-form').hidden = true;
    $('reference-port').replaceChildren();
    $('reference-csbs').replaceChildren();
    $('catalog-form').hidden = true;
    $('catalog-products').replaceChildren();
    $('receipt-form').hidden = true;
    $('receipt-items').replaceChildren();
    $('stock-list').replaceChildren();
    $('dashboard-summary').replaceChildren();
    clearDashboardDetails();
    clearDashboardReport();
    $('dashboard-status').textContent = '';
    $('stock-history-summary').replaceChildren();
    $('stock-history-list').replaceChildren();
    $('stock-history-bars').replaceChildren();
    $('stock-history-evolution').replaceChildren();
    $('stock-history-applied').textContent = '';
    $('stock-history-port').textContent = '';
    $('stock-history-status').textContent = '';
    $('stock-history-more').hidden = true;
    $('stock-history-filter').reset();
    $('receipt-list').replaceChildren();
    $('planning-form').hidden = true;
    $('planning-items').replaceChildren();
    $('planning-list').replaceChildren();
    $('flight-form').hidden = true;
    $('flight-parcels').replaceChildren();
    $('flight-list').replaceChildren();
    $('flight-edit-form').hidden = true;
    $('flight-edit-items').replaceChildren();
    $('flight-needs').replaceChildren();
    $('shipment-form').hidden = true;
    $('shipment-items').replaceChildren();
    $('shipment-needs').replaceChildren();
    $('shipment-list').replaceChildren();
    $('shipment-edit-form').hidden = true;
    $('shipment-edit-items').replaceChildren();
    $('quarantine-form').hidden = true;
    $('quarantine-list').replaceChildren();
    $('inventory-form').hidden = true;
    $('inventory-items').replaceChildren();
    $('inventory-list').replaceChildren();
    clearInventoryPrintReport();
    clearFlightPrintReport();
}

async function refreshUsers() {
    const generation = sessionGeneration, sequence = ++usersRequest;
    const users = await request('/rest/v1/rpc/qbox_admin_users_with_names', {}, true);
    if (generation !== sessionGeneration || sequence !== usersRequest) return;
    $('pending').textContent = `${users.filter(user => user.status === 'pending').length} demande(s) en attente`;
    const container = $('users');
    container.replaceChildren();
    for (const user of users) {
        const card = document.createElement('article');
        card.className = 'user account-card';
        const header = document.createElement('div');
        header.className = 'account-card-header';
        const info = document.createElement('p');
        info.className = 'account-email';
        info.textContent = user.email;
        const status = document.createElement('span');
        status.className = `account-status account-status-${user.status}`;
        status.textContent = statuses[user.status] || user.status;
        header.append(info, status);
        const details = document.createElement('p');
        details.className = 'account-details';
        details.textContent = `Nom : ${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Non renseigné'} · Téléphone : ${user.phone || 'Non renseigné'} · Rôle demandé : ${roles[user.requested_role] || user.requested_role}`;
        const actions = document.createElement('div');
        actions.className = 'actions account-actions';
        const roleLabel = document.createElement('label');
        roleLabel.className = 'account-role';
        roleLabel.textContent = 'Rôle attribué';
        const roleSelect = document.createElement('select');
        for (const [value, label] of Object.entries(roles)) roleSelect.add(new Option(label, value));
        roleSelect.value = user.role || user.requested_role;
        roleLabel.append(roleSelect);
        actions.append(roleLabel);
        for (const [label, status] of [['Valider / réactiver', 'approved'], ['Suspendre', 'suspended'], ['Refuser', 'rejected']]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            button.className = `account-action account-action-${status}`;
            button.addEventListener('click', async () => {
                if (!confirm(`${label} le compte ${user.email} ?`)) return;
                try {
                    await request('/rest/v1/rpc/qbox_admin_set_user', { target_id: user.user_id, new_role: roleSelect.value, new_status: status }, true);
                    if (user.user_id === currentUser.user_id && (status !== 'approved' || roleSelect.value !== 'admin')) {
                        clearSession();
                        message('Votre accès administrateur a changé. Reconnectez-vous.');
                        return;
                    }
                    await refreshUsers();
                    message('Compte mis à jour.');
                } catch (error) { message(error.message, true); }
            });
            actions.append(button);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Supprimer définitivement';
        remove.className = 'account-action account-action-delete';
        remove.addEventListener('click', async () => {
            if (!confirm(`Supprimer définitivement le compte ${user.email} ?`)) return;
            try {
                await request('/rest/v1/rpc/qbox_admin_delete_user', { target_id: user.user_id }, true);
                await refreshUsers();
                message('Compte supprimé.');
            } catch (error) { message(error.message, true); }
        });
        actions.append(remove);
        const editName = document.createElement('button');
        editName.type = 'button';
        editName.textContent = 'Modifier le prénom et le nom';
        editName.className = 'account-action';
        editName.addEventListener('click', () => {
            if (nameSaving || $('admin-name-dialog').open) return;
            editingUserName = user.user_id;
            $('admin-name-account').textContent = user.email;
            $('admin-name-first').value = user.first_name || '';
            $('admin-name-last').value = user.last_name || '';
            $('admin-name-status').textContent = '';
            $('admin-name-dialog').showModal();
        });
        actions.append(editName);
        card.append(header, details, actions);
        container.append(card);
    }
    if (!users.length) {
        const empty = document.createElement('p');
        empty.className = 'accounts-empty';
        empty.textContent = 'Aucun compte à afficher.';
        container.append(empty);
    }
}

$('signup').addEventListener('submit', async event => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const showStatus = (text, error = false) => {
        $('signup-status').textContent = text;
        $('signup-status').classList.toggle('is-error', error);
    };
    const form = new FormData(formElement);
    const phone = form.get('phone').trim();
    const firstName = form.get('first_name').trim(), lastName = form.get('last_name').trim();
    if (!firstName || !lastName) {
        showStatus('Renseignez votre prénom et votre nom.', true);
        return;
    }
    if (!/^\+?[\d ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
        showStatus('Téléphone invalide : indiquez entre 7 et 15 chiffres.', true);
        return;
    }
    try {
        await request('/auth/v1/signup', { email: form.get('email').trim(), password: form.get('password'), data: { phone, requested_role: form.get('role'), first_name: firstName, last_name: lastName } });
        formElement.reset();
        showStatus('Demande envoyée. Vérifiez votre adresse e-mail si une confirmation est demandée. Votre compte nécessite une validation administrateur.');
    } catch (error) { showStatus(error.message, true); }
});

async function initializeAccount(preferredPort, generation = sessionGeneration) {
    const profiles = await request('/rest/v1/rpc/qbox_my_profile', {}, true);
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    currentUser = profiles[0];
    if (!currentUser || currentUser.status !== 'approved') throw new Error('Compte en attente, refusé ou suspendu : contactez un administrateur.');
    $('flight-test').hidden = currentUser.role !== 'admin';
    $('identity').textContent = `${currentUser.email} · ${roles[currentUser.role]}`;
    geography = await request('/rest/v1/rpc/qbox_geography', {}, true);
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    await refreshReferences(preferredPort);
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    categories = await request('/rest/v1/rpc/qbox_list_categories', {}, true);
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    await refreshProducts();
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    await refreshStock();
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    await refreshStockHistory();
    if (generation !== sessionGeneration) throw new Error('Session remplacée.');
    if (currentUser.role === 'admin') {
        $('administration').hidden = false;
        await refreshUsers();
        if (generation !== sessionGeneration) throw new Error('Session remplacée.');
        timer = setInterval(() => refreshUsers().catch(error => message(error.message, true)), 30000);
    }
    $('authentication').hidden = true;
    $('session').hidden = false;
}

$('logout').addEventListener('click', async () => {
    const requestGeneration = sessionGeneration;
    try {
        await request('/auth/v1/logout', {}, true);
        if (requestGeneration !== sessionGeneration) return;
        clearSession();
        message('Session fermée.');
    } catch (error) {
        if (requestGeneration === sessionGeneration) message(error.message, true);
    }
});
$('admin-name-cancel').addEventListener('click', () => {
    if (nameSaving) return;
    editingUserName = null;
    $('admin-name-dialog').close();
});
$('admin-name-dialog').addEventListener('cancel', event => {
    if (nameSaving) event.preventDefault();
    else editingUserName = null;
});
$('admin-name-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'admin' || !editingUserName || nameSaving) return;
    const firstName = $('admin-name-first').value.trim(), lastName = $('admin-name-last').value.trim();
    if (!firstName || !lastName) { $('admin-name-status').textContent = 'Renseignez un prénom et un nom.'; return; }
    const generation = sessionGeneration, targetId = editingUserName;
    nameSaving = true;
    $('admin-name-submit').disabled = true;
    $('admin-name-cancel').disabled = true;
    try {
        await request('/rest/v1/rpc/qbox_admin_set_name', {target_id:targetId, first_name:firstName, last_name:lastName}, true);
        if (generation !== sessionGeneration) return;
        editingUserName = null;
        $('admin-name-dialog').close();
        try {
            await refreshUsers();
            if (generation === sessionGeneration) message('Nom enregistré. Actualisez les historiques pour voir la modification.');
        } catch (error) {
            if (generation === sessionGeneration) message(`Nom enregistré, mais actualisation impossible : ${error.message}`, true);
        }
    } catch (error) {
        if (generation === sessionGeneration) $('admin-name-status').textContent = error.message;
    } finally {
        if (generation === sessionGeneration) {
            nameSaving = false;
            $('admin-name-submit').disabled = false;
            $('admin-name-cancel').disabled = false;
        }
    }
});
$('password-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (embedded || !currentUser || passwordSaving) return;
    const current = $('password-current').value, next = $('password-new').value;
    if (next.length < 8 || next !== $('password-confirm').value || next === current) {
        $('password-status').textContent = 'Vérifiez la confirmation et choisissez un nouveau mot de passe différent de 8 caractères minimum.';
        return;
    }
    const user = currentUser, generation = passwordGeneration;
    passwordSaving = true;
    $('password-submit').disabled = true;
    try {
        const warning = await QBoxPassword.change(config, {id:user.user_id, email:user.email}, current, next,
            () => passwordGeneration === generation && currentUser === user);
        if (passwordGeneration !== generation) return;
        clearSession();
        message(warning || 'Mot de passe modifié. Reconnectez-vous avec le nouveau mot de passe.', !!warning);
    } catch (error) {
        if (passwordGeneration === generation) $('password-status').textContent = error.message;
    } finally {
        if (passwordGeneration === generation) {
            passwordSaving = false;
            $('password-submit').disabled = false;
        }
    }
});
$('refresh').addEventListener('click', () => refreshUsers().catch(error => message(error.message, true)));

function allowReferenceWrite(section) {
    const allowed = currentUser && (currentUser.role === 'admin' ||
        (section === 'csb' && QBoxAuthPolicy.roleMatches(currentUser.role, ['pilot', 'logistics'])) ||
        (['catalog', 'stock', 'planning', 'shipment'].includes(section) && QBoxAuthPolicy.roleMatches(currentUser.role, ['logistics'])) ||
        (section === 'flight' && QBoxAuthPolicy.roleMatches(currentUser.role, ['pilot'])));
    if (!allowed) message("Vous ne disposez pas des autorisations nécessaires.", true);
    return allowed;
}

function fillOptions(select, values, selected) {
    select.replaceChildren();
    for (const value of values) select.add(new Option(value, value));
    if (selected && values.includes(selected)) select.value = selected;
}

function refreshDistricts(selected) {
    const form = $('reference-csb-form');
    fillOptions(form.elements.district, geography.filter(item => item.region === form.elements.region.value).map(item => item.district), selected);
}

function openPortForm(port = null) {
    if (!allowReferenceWrite('port')) return;
    editingPort = port?.id || null;
    const form = $('reference-port-form');
    form.reset();
    form.elements.name.value = port?.name || '';
    fillOptions(form.elements.region, [...new Set(geography.map(item => item.region))], port?.region);
    $('port-form-heading').textContent = port ? 'Modifier le port' : 'Ajouter un port';
    form.hidden = false;
}

function openCsbForm(csb = null) {
    if (!allowReferenceWrite('csb')) return;
    if (!$('reference-port').value) {
        message("Sélectionnez d'abord un drone port.", true);
        return;
    }
    editingCsb = csb?.id || null;
    const form = $('reference-csb-form');
    form.reset();
    form.elements.name.value = csb?.name || '';
    form.elements.distance.value = csb?.distance_km ?? '';
    form.elements.chief.value = csb?.chief || '';
    form.elements.phones.value = (csb?.phones || []).join('\n');
    fillOptions(form.elements.region, [...new Set(geography.map(item => item.region))], csb?.region || ports.find(p => p.id === $('reference-port').value)?.region);
    refreshDistricts(csb?.district);
    $('csb-form-heading').textContent = csb ? 'Modifier le CSB' : 'Ajouter un CSB';
    form.hidden = false;
}

async function refreshCsbs() {
    const port = $('reference-port').value;
    const sequence = ++csbRequest;
    const result = port ? await request('/rest/v1/rpc/qbox_list_csbs', { selected_port: port }, true) : [];
    if (sequence !== csbRequest || port !== $('reference-port').value) return;
    csbs = result;
    const container = $('reference-csbs');
    container.replaceChildren();
    if (!csbs.length) container.textContent = 'Aucun CSB pour ce port.';
    for (const csb of csbs) {
        const card = document.createElement('article');
        card.className = 'user';
        const info = document.createElement('p');
        info.textContent = `${csb.code} · ${csb.name} · ${csb.region} / ${csb.district} · ${csb.distance_km} km`;
        const contact = document.createElement('p');
        contact.textContent = `Chef : ${csb.chief || 'Non renseigné'} · Téléphones : ${(csb.phones || []).join(', ') || 'Non renseignés'}`;
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Modifier';
        edit.addEventListener('click', () => openCsbForm(csb));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Supprimer';
        remove.addEventListener('click', async () => {
            if (!allowReferenceWrite('csb') || !confirm(`Supprimer le CSB « ${csb.name} » ?`)) return;
            try {
                await request('/rest/v1/rpc/qbox_delete_csb', { selected_port: csb.port_id, csb_id: csb.id }, true);
                await refreshCsbs();
                message('CSB supprimé.');
            } catch (error) { message(error.message, true); }
        });
        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.append(edit, remove);
        card.append(info, contact, actions);
        container.append(card);
    }
}

async function refreshReferences(preferredPort) {
    const selected = preferredPort || $('reference-port').value;
    ports = await request('/rest/v1/rpc/qbox_list_ports', {}, true);
    const select = $('reference-port');
    select.replaceChildren();
    for (const port of ports) select.add(new Option(`${port.name} · ${port.region}`, port.id));
    if (ports.some(port => port.id === selected)) select.value = selected;
    if (activePort && activePort !== select.value) {
        dashboardRequest++;
        $('dashboard-summary').replaceChildren();
        clearDashboardDetails();
        clearDashboardReport();
        $('dashboard-status').textContent = 'Chargement…';
        clearInventoryPrintReport();
        clearFlightPrintReport();
        historyRequest++;
        historyCursor = null;
        historyFilter = null;
        historyRows = [];
        $('stock-history-list').replaceChildren();
        $('stock-history-summary').replaceChildren();
        $('stock-history-bars').replaceChildren();
        $('stock-history-evolution').replaceChildren();
        $('stock-history-applied').textContent = '';
        $('stock-history-status').textContent = 'Chargement…';
        $('stock-history-more').hidden = true;
        inventorySnapshotRequest++;
        flightEditRequest++;
        flightEdit = null;
        $('flight-edit-form').hidden = true;
        shipmentEditRequest++;
        shipmentEdit = null;
        $('shipment-edit-form').hidden = true;
        inventoryDraft = null;
        $('inventory-form').hidden = true;
        $('inventory-items').replaceChildren();
        $('quarantine-form').hidden = true;
    }
    activePort = select.value;
    notifyEmbeddedPort();
    await refreshDashboard();
    await refreshCsbs();
    await refreshStock();
    await refreshPlannings();
    await refreshFlights();
    await refreshShipments();
    await Promise.all([refreshQuarantines(), refreshInventories()]);
}

$('port-new').addEventListener('click', () => openPortForm());
$('port-edit').addEventListener('click', () => {
    if (!allowReferenceWrite('port')) return;
    const port = ports.find(item => item.id === $('reference-port').value);
    if (port) openPortForm(port); else message('Aucun drone port sélectionné.', true);
});
$('port-delete').addEventListener('click', async () => {
    if (!allowReferenceWrite('port')) return;
    const port = ports.find(item => item.id === $('reference-port').value);
    if (!port) { message('Aucun drone port sélectionné.', true); return; }
    if (!confirm(`Supprimer le drone port « ${port.name} » ?`)) return;
    try {
        await request('/rest/v1/rpc/qbox_delete_port', { port_id: port.id }, true);
        $('reference-port-form').hidden = true;
        $('reference-csb-form').hidden = true;
        await refreshReferences();
        message('Drone port supprimé.');
    } catch (error) { message(error.message, true); }
});
$('reference-port-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('port')) return;
    const form = event.currentTarget;
    try {
        const id = await request('/rest/v1/rpc/qbox_save_port', { port_id: editingPort, port_name: form.elements.name.value.trim(), port_region: form.elements.region.value }, true);
        form.hidden = true;
        await refreshReferences(id);
        message('Drone port enregistré.');
    } catch (error) { message(error.message, true); }
});
$('csb-new').addEventListener('click', () => openCsbForm());
$('reference-csb-form').elements.region.addEventListener('change', () => refreshDistricts());
$('reference-csb-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('csb')) return;
    const form = event.currentTarget;
    try {
        await request('/rest/v1/rpc/qbox_save_csb', {
            csb_id: editingCsb, selected_port: $('reference-port').value,
            csb_name: form.elements.name.value.trim(), csb_region: form.elements.region.value,
            csb_district: form.elements.district.value, csb_distance: Number(form.elements.distance.value),
            csb_chief: form.elements.chief.value.trim(),
            csb_phones: form.elements.phones.value.split(/\r?\n/).map(phone => phone.trim()).filter(Boolean)
        }, true);
        form.hidden = true;
        await refreshCsbs();
        message('CSB enregistré.');
    } catch (error) { message(error.message, true); }
});
$('port-cancel').addEventListener('click', () => { $('reference-port-form').hidden = true; });
$('csb-cancel').addEventListener('click', () => { $('reference-csb-form').hidden = true; });
$('reference-port').addEventListener('change', () => {
    if (receiptSaving || planningSaving || flightSaving || shipmentSaving || quarantineSaving || inventorySaving) {
        $('reference-port').value = activePort;
        message("Attendez la fin de l'opération avant de changer de port.", true);
        notifyEmbeddedPort();
        return;
    }
    if ((inventoryDraft || flightEdit || shipmentEdit ||
        ['quarantine-form', 'receipt-form', 'planning-form', 'flight-form', 'shipment-form',
            'reference-csb-form', 'reference-port-form'].some(id => !$(id).hidden)) &&
        !confirm("Changer de port et abandonner les saisies en cours ?")) {
        $('reference-port').value = activePort;
        return;
    }
    activePort = $('reference-port').value;
    notifyEmbeddedPort();
    dashboardRequest++;
    $('dashboard-summary').replaceChildren();
    clearDashboardDetails();
    clearDashboardReport();
    $('dashboard-status').textContent = 'Chargement…';
    clearInventoryPrintReport();
    clearFlightPrintReport();
    historyRequest++;
    historyCursor = null;
    historyFilter = null;
    historyRows = [];
    $('stock-history-list').replaceChildren();
    $('stock-history-summary').replaceChildren();
    $('stock-history-bars').replaceChildren();
    $('stock-history-evolution').replaceChildren();
    $('stock-history-applied').textContent = '';
    $('stock-history-status').textContent = 'Chargement…';
    $('stock-history-more').hidden = true;
    inventorySnapshotRequest++;
    flightEditRequest++;
    flightEdit = null;
    shipmentEditRequest++;
    shipmentEdit = null;
    csbs = [];
    csbRequest++;
    plans = [];
    stockLots = [];
    $('reference-csb-form').hidden = true;
    $('reference-port-form').hidden = true;
    $('receipt-form').hidden = true;
    $('planning-form').hidden = true;
    $('flight-form').hidden = true;
    $('flight-edit-form').hidden = true;
    $('shipment-form').hidden = true;
    $('shipment-edit-form').hidden = true;
    inventoryDraft = null;
    $('inventory-form').hidden = true;
    $('inventory-items').replaceChildren();
    $('quarantine-form').hidden = true;
    Promise.all([refreshDashboard(), refreshCsbs(), refreshStock(), refreshStockHistory(), refreshPlannings(), refreshFlights(), refreshShipments(), refreshQuarantines(), refreshInventories()]).catch(error => message(error.message, true));
});
$('reference-refresh').addEventListener('click', () => refreshReferences().catch(error => message(error.message, true)));

function openProductForm(product = null) {
    if (!allowReferenceWrite('catalog')) return;
    editingProduct = product?.id || null;
    const form = $('catalog-form');
    form.reset();
    form.elements.name.value = product?.name || '';
    form.elements.unit.value = product?.unit || '';
    form.elements.threshold.value = product?.min_threshold ?? 0;
    form.elements.category.replaceChildren();
    for (const category of categories) form.elements.category.add(new Option(category.name, category.id));
    if (product) form.elements.category.value = product.category_id;
    $('catalog-heading').textContent = product ? "Modifier l'intrant" : 'Ajouter un intrant';
    form.hidden = false;
}

async function refreshProducts() {
    const sequence = ++productRequest;
    const result = await request('/rest/v1/rpc/qbox_list_products', {}, true);
    if (sequence !== productRequest) return;
    products = result;
    const container = $('catalog-products');
    container.replaceChildren();
    if (!products.length) container.textContent = 'Aucun intrant dans le catalogue.';
    for (const product of products) {
        const card = document.createElement('article');
        card.className = 'user';
        const info = document.createElement('p');
        info.textContent = `${product.code} · ${product.name} · ${product.category} · ${product.unit} · Seuil : ${product.min_threshold}`;
        const actions = document.createElement('div');
        actions.className = 'actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Modifier';
        edit.addEventListener('click', () => openProductForm(product));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = 'Supprimer';
        remove.addEventListener('click', async () => {
            if (!allowReferenceWrite('catalog') || !confirm(`Supprimer l'intrant « ${product.name} » ?`)) return;
            try {
                await request('/rest/v1/rpc/qbox_delete_product', { product_id: product.id }, true);
                await refreshProducts();
                message('Intrant supprimé.');
            } catch (error) { message(error.message, true); }
        });
        actions.append(edit, remove);
        card.append(info, actions);
        container.append(card);
    }
}

$('catalog-new').addEventListener('click', () => openProductForm());
$('catalog-cancel').addEventListener('click', () => { $('catalog-form').hidden = true; });
$('catalog-refresh').addEventListener('click', () => refreshProducts().catch(error => message(error.message, true)));
$('catalog-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('catalog')) return;
    const form = event.currentTarget;
    const threshold = Number(form.elements.threshold.value);
    if (!Number.isSafeInteger(threshold) || threshold < 0 || !form.elements.threshold.value.trim()) {
        message("Saisissez un seuil entier valide.", true);
        return;
    }
    try {
        await request('/rest/v1/rpc/qbox_save_product', {
            product_id: editingProduct, product_name: form.elements.name.value.trim(),
            product_category: form.elements.category.value, product_unit: form.elements.unit.value.trim(),
            product_threshold: threshold
        }, true);
        form.hidden = true;
        await refreshProducts();
        message('Intrant enregistré.');
    } catch (error) { message(error.message, true); }
});

function dashboardLines(data) {
    const stock = BigInt(data.stock), reserved = BigInt(data.reserved);
    const lines = [
        `Stock enregistré : ${stock.toLocaleString('fr-FR')} · Réservé aux vols : ${reserved.toLocaleString('fr-FR')} · Disponible : ${(stock - reserved).toLocaleString('fr-FR')}`,
        `Vols en cours : ${data.flights} · Expéditions terrestres en cours : ${data.shipments} · CSB du réseau : ${data.csbs}`
    ];
    if (!data.planning) {
        lines.push('Aucun planning actif pour ce port.');
        return lines;
    }
    const p = data.planning;
    const planned = BigInt(p.planned), delivered = BigInt(p.delivered);
    const flight = BigInt(p.in_flight), transit = BigInt(p.in_transit);
    const remaining = planned - delivered - flight - transit;
    const percent = planned === 0n ? 'N/A' : `${(delivered * 100n + planned / 2n) / planned} %`;
    lines.push(`Planning ${p.code} · ${p.start_date} au ${p.end_date} · ${p.csbs} CSB`);
    lines.push(`Prévu : ${planned.toLocaleString('fr-FR')} · Livré : ${delivered.toLocaleString('fr-FR')} (${percent}) · En vol : ${flight.toLocaleString('fr-FR')} · Transit terrestre : ${transit.toLocaleString('fr-FR')} · Restant : ${remaining.toLocaleString('fr-FR')}`);
    return lines;
}

function clearDashboardDetails() {
    for (const id of ['dashboard-flights', 'dashboard-shipments', 'dashboard-expirations']) $(id).replaceChildren();
}

function renderDashboardList(id, entries, total, emptyText, format) {
    const container = $(id);
    if (!entries.length) {
        container.textContent = emptyText;
        return;
    }
    if (total > entries.length) {
        const note = document.createElement('p');
        note.textContent = `${entries.length} sur ${total} affichés ; consultez la section correspondante pour la liste complète.`;
        container.append(note);
    }
    for (const entry of entries) {
        const card = document.createElement('article');
        card.className = 'user';
        for (const text of format(entry)) {
            const line = document.createElement('p');
            line.textContent = text;
            card.append(line);
        }
        container.append(card);
    }
}

function renderDashboardDetails(data) {
    const itemLines = items => items.map(item =>
        `${item.name} · Lot ${item.lot} · ${BigInt(item.quantity).toLocaleString('fr-FR')} ${item.unit}`);
    renderDashboardList('dashboard-flights', data.flight_list, data.flights, 'Aucun vol en cours.',
        flight => [`${flight.bl} · ${flight.csb} · Planning ${flight.planning}`, ...itemLines(flight.items)]);
    renderDashboardList('dashboard-shipments', data.shipment_list, data.shipments, 'Aucune expédition terrestre en cours.',
        shipment => [`${shipment.reference} · ${shipment.csb} · ${shipment.transport} · Planning ${shipment.planning}`, ...itemLines(shipment.items)]);
    renderDashboardList('dashboard-expirations', data.expirations, data.expiry_count, 'Aucun lot avec stock et date de péremption renseignée.',
        lot => {
            const status = { expired: 'Périmé', soon: 'Dans les 3 mois', later: 'Plus de 3 mois' }[lot.classification];
            const quantity = BigInt(lot.quantity), reserved = BigInt(lot.reserved);
            return [`${lot.name} · Lot ${lot.lot} · Péremption : ${lot.expiry_date} · ${status}`,
                `Stock : ${quantity.toLocaleString('fr-FR')} ${lot.unit} · Réservé : ${reserved.toLocaleString('fr-FR')} · Disponible : ${(quantity - reserved).toLocaleString('fr-FR')}`];
        });
}

async function refreshDashboard() {
    const port = $('reference-port').value;
    const sequence = ++dashboardRequest;
    const container = $('dashboard-summary');
    container.replaceChildren();
    clearDashboardDetails();
    if (!port) { $('dashboard-status').textContent = 'Aucun port sélectionné.'; return; }
    $('dashboard-status').textContent = 'Chargement…';
    try {
        const data = await request('/rest/v1/rpc/qbox_dashboard_details', { selected_port: port }, true);
        if (sequence !== dashboardRequest || port !== $('reference-port').value || !token) return;
        for (const text of dashboardLines(data)) {
            const line = document.createElement('p');
            line.textContent = text;
            container.append(line);
        }
        renderDashboardDetails(data);
        $('dashboard-status').textContent = `Port : ${ports.find(item => item.id === port)?.name || port} · Actualisé le ${new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (heure de Madagascar).`;
    } catch (error) {
        if (!token && error.message === 'Session expirée : reconnectez-vous.') {
            message(error.message, true);
            return;
        }
        if (sequence !== dashboardRequest || port !== $('reference-port').value || !token) return;
        container.replaceChildren();
        clearDashboardDetails();
        $('dashboard-status').textContent = `Tableau de bord indisponible : ${error.message}`;
    }
}
$('dashboard-refresh').addEventListener('click', () => refreshDashboard());

function clearDashboardReport() {
    dashboardReportRequest++;
    document.body.classList.remove('print-dashboard');
    $('dashboard-report-preview').hidden = true;
    $('dashboard-report').replaceChildren();
    $('dashboard-report-status').textContent = '';
}

async function openDashboardReport() {
    clearDashboardReport();
    const port = $('reference-port').value;
    const sequence = dashboardReportRequest;
    if (!port) {
        $('dashboard-report-status').textContent = 'Aucun port sélectionné.';
        return;
    }
    $('dashboard-report-status').textContent = 'Chargement du rapport…';
    try {
        const data = await request('/rest/v1/rpc/qbox_dashboard_report', { selected_port: port }, true);
        if (sequence !== dashboardReportRequest || port !== $('reference-port').value || !token) return;
        if (!data) {
            $('dashboard-report-status').textContent = 'Aucun planning actif pour ce port.';
            return;
        }
        renderDashboardReport(data, $('dashboard-report'));
        $('dashboard-report-preview').hidden = false;
        $('dashboard-report-status').textContent = 'Rapport chargé : actualisez-le pour voir les changements ultérieurs.';
    } catch (error) {
        if (!token && error.message === 'Session expirée : reconnectez-vous.') {
            message(error.message, true);
            return;
        }
        if (sequence !== dashboardReportRequest || port !== $('reference-port').value || !token) return;
        clearDashboardReport();
        $('dashboard-report-status').textContent = `Rapport indisponible : ${error.message}`;
    }
}
$('dashboard-report-open').addEventListener('click', openDashboardReport);
$('dashboard-report-close').addEventListener('click', clearDashboardReport);
$('dashboard-report-print').addEventListener('click', () => {
    document.body.classList.add('print-dashboard');
    window.print();
});
window.addEventListener('afterprint', () => document.body.classList.remove('print-dashboard'));

async function refreshStock() {
    const port = $('reference-port').value;
    const sequence = ++stockRequest;
    const [stocks, receipts] = port ? await Promise.all([
        request('/rest/v1/rpc/qbox_list_stocks', { selected_port: port }, true),
        request('/rest/v1/rpc/qbox_list_receipts', { selected_port: port }, true)
    ]) : [[], []];
    if (sequence !== stockRequest || port !== $('reference-port').value) return;
    stockLots = stocks;
    renderStockHistorySummary(stocks);
    if (!$('flight-form').hidden) updateFlightNeeds();
    if (!$('shipment-form').hidden) updateShipmentNeeds();
    const stockList = $('stock-list');
    stockList.replaceChildren();
    if (!stocks.length) stockList.textContent = 'Aucun stock pour ce port.';
    for (const stock of stocks) {
        const row = document.createElement('p');
        row.textContent = `${stock.name} · Lot ${stock.lot} · Péremption : ${stock.expiry_date || 'Non renseignée'} · Stock : ${stock.quantity} · Réservé : ${stock.reserved} · Disponible : ${stock.available}`;
        stockList.append(row);
    }
    const receiptList = $('receipt-list');
    receiptList.replaceChildren();
    if (!receipts.length) receiptList.textContent = 'Aucune réception pour ce port.';
    for (const receipt of receipts) {
        const card = document.createElement('article');
        card.className = 'user';
        const title = document.createElement('p');
        title.textContent = `${receipt.reference} · ${new Date(receipt.received_at).toLocaleString('fr-FR')}`;
        card.append(title);
        for (const item of receipt.items) {
            const line = document.createElement('p');
            line.textContent = `${item.name} · Lot ${item.lot} · ${item.quantity} · Péremption : ${item.expiry_date}`;
            card.append(line);
        }
        receiptList.append(card);
    }
}

function renderStockHistorySummary(stocks) {
    const balances = new Map();
    for (const stock of stocks) {
        const total = balances.get(stock.product_id) || { id: stock.product_id, name: stock.name, quantity: 0, reserved: 0 };
        total.quantity += stock.quantity;
        total.reserved += stock.reserved;
        balances.set(stock.product_id, total);
    }
    const container = $('stock-history-summary');
    container.replaceChildren();
    const bars = $('stock-history-bars');
    bars.replaceChildren();
    const maximum = [...balances.values()].reduce((max, item) => Math.max(max, item.quantity - item.reserved), 0);
    if (!balances.size) container.textContent = 'Aucun stock pour ce port.';
    for (const balance of balances.values()) {
        const row = document.createElement('p');
        row.textContent = `${balance.name} · Stock : ${balance.quantity} · Réservé : ${balance.reserved} · Disponible : ${balance.quantity - balance.reserved}`;
        container.append(row);
        const bar = document.createElement('div');
        bar.className = 'history-bar';
        const name = document.createElement('span');
        name.textContent = balance.name;
        const track = document.createElement('div');
        track.className = 'history-bar-track';
        const fill = document.createElement('div');
        fill.className = 'history-bar-fill';
        fill.style.width = `${maximum ? 100 * (balance.quantity - balance.reserved) / maximum : 0}%`;
        const product = products.find(item => item.id === balance.id);
        const available = balance.quantity - balance.reserved;
        const threshold = product?.min_threshold;
        fill.style.backgroundColor = threshold == null ? '#64748b'
            : available < threshold ? '#b91c1c' : available <= threshold * 1.5 ? '#b45309' : '#15803d';
        track.append(fill);
        const value = document.createElement('span');
        value.textContent = balance.quantity - balance.reserved;
        bar.append(name, track, value);
        bars.append(bar);
    }
}

async function refreshStockHistory(loadMore = false) {
    const port = $('reference-port').value;
    const form = $('stock-history-filter');
    if (!port) {
        historyRequest++;
        historyCursor = null;
        historyFilter = null;
        historyRows = [];
        $('stock-history-list').replaceChildren();
        $('stock-history-status').textContent = 'Aucun port sélectionné.';
        $('stock-history-evolution').replaceChildren();
        $('stock-history-applied').textContent = '';
        $('stock-history-port').textContent = '';
        $('stock-history-more').hidden = true;
        return;
    }
    const filter = loadMore ? historyFilter : {
        from_date: form.elements.from.value || null, to_date: form.elements.to.value || null,
        operation_filter: form.elements.operation.value || null, search_text: form.elements.search.value.trim() || null
    };
    if (!filter || (loadMore && !historyCursor)) return;
    if (filter.from_date && filter.to_date && filter.from_date > filter.to_date) {
        throw new Error('La date de début doit précéder ou égaler la date de fin.');
    }
    const cursor = loadMore ? historyCursor : null;
    const sequence = ++historyRequest;
    $('stock-history-more').disabled = true;
    if (!loadMore) {
        historyFilter = null;
        historyCursor = null;
        historyRows = [];
        $('stock-history-list').replaceChildren();
        $('stock-history-evolution').replaceChildren();
        $('stock-history-applied').textContent = '';
        $('stock-history-more').hidden = true;
    }
    $('stock-history-status').textContent = 'Chargement…';
    try {
        const rows = await request('/rest/v1/rpc/qbox_stock_history', {
            selected_port: port, ...filter, before_time: cursor?.time || null, before_id: cursor?.id || null
        }, true);
        if (sequence !== historyRequest || port !== $('reference-port').value || !token) return;
        historyFilter = filter;
        historyRows.push(...rows);
        $('stock-history-port').textContent = `Port : ${ports.find(item => item.id === port)?.name || port}`;
        $('stock-history-applied').textContent = `Filtres appliqués : du ${filter.from_date || 'début'} au ${filter.to_date || 'présent'} · Opération : ${filter.operation_filter || 'toutes'} · Intrant : ${filter.search_text || 'tous'}`;
        const list = $('stock-history-list');
        for (const entry of rows) {
            const card = document.createElement('article');
            card.className = 'user';
            const line = document.createElement('p');
            const before = entry.before_stock === null ? 'inconnu' : entry.before_stock;
            const beforeReserved = entry.before_reserved === null ? 'inconnu' : entry.before_reserved;
            line.textContent = `${new Date(entry.occurred_at).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} · ${entry.product_name} · ${entry.operation} · Référence : ${entry.reference || '—'} · Stock : ${before} → ${entry.after_stock} · Réservé : ${beforeReserved} → ${entry.after_reserved} · Disponible après : ${entry.after_stock - entry.after_reserved} · Utilisateur : ${entry.performed_by_name || 'Nom non renseigné'}`;
            card.append(line);
            list.append(card);
        }
        historyCursor = rows.length === 100 ? { time: rows[rows.length - 1].occurred_at, id: rows[rows.length - 1].id } : null;
        renderHistoryEvolution();
        $('stock-history-more').hidden = !historyCursor;
        $('stock-history-status').textContent = list.children.length
            ? `${list.children.length} mouvement(s) affiché(s)${historyCursor ? ' ; d’autres mouvements peuvent être chargés.' : '.'}`
            : 'Aucun mouvement pour ces filtres.';
    } catch (error) {
        if (sequence === historyRequest && port === $('reference-port').value) {
            $('stock-history-status').textContent = 'Impossible de charger l’historique.';
        }
        throw error;
    } finally {
        if (sequence === historyRequest) $('stock-history-more').disabled = false;
    }
}

$('stock-history-filter').addEventListener('submit', event => {
    event.preventDefault();
    refreshStockHistory().catch(error => message(error.message, true));
});
$('stock-history-refresh').addEventListener('click', () =>
    Promise.all([refreshStock(), refreshStockHistory()]).catch(error => message(error.message, true)));
$('stock-history-more').addEventListener('click', () =>
    refreshStockHistory(true).catch(error => message(error.message, true)));

function renderHistoryEvolution() {
    const container = $('stock-history-evolution');
    container.replaceChildren();
    if (!historyRows.length) { container.textContent = 'Aucun mouvement chargé.'; return; }
    const groups = new Map();
    for (const entry of [...historyRows].reverse()) {
        if (!groups.has(entry.product_name)) groups.set(entry.product_name, []);
        groups.get(entry.product_name).push(entry);
    }
    const times = historyRows.map(entry => new Date(entry.occurred_at).getTime());
    const values = historyRows.map(entry => entry.after_stock - entry.after_reserved);
    const minTime = times.reduce((min, time) => Math.min(min, time), Infinity);
    const maxTime = times.reduce((max, time) => Math.max(max, time), -Infinity);
    const maxValue = values.reduce((max, value) => Math.max(max, value), 1);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 800 260');
    svg.setAttribute('class', 'history-chart');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Disponible après les mouvements chargés ; les valeurs détaillées sont listées ci-dessous');
    for (const y of [20, 70, 120, 170, 220]) {
        const grid = document.createElementNS(ns, 'path');
        grid.setAttribute('d', `M 45 ${y} H 785`);
        grid.setAttribute('fill', 'none');
        grid.setAttribute('stroke', '#e2e8f0');
        svg.append(grid);
    }
    const axis = document.createElementNS(ns, 'path');
    axis.setAttribute('d', 'M 45 15 V 220 H 785');
    axis.setAttribute('fill', 'none'); axis.setAttribute('stroke', '#cbd5e1');
    svg.append(axis);
    for (const [y, value] of [[20, maxValue], [220, 0]]) {
        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', '40'); label.setAttribute('y', String(y));
        label.setAttribute('text-anchor', 'end'); label.setAttribute('font-size', '12'); label.setAttribute('fill', '#64748b');
        label.textContent = String(value); svg.append(label);
    }
    const legend = document.createElement('div');
    legend.className = 'history-legend';
    const colors = ['#0369a1', '#b91c1c', '#15803d', '#a16207', '#7e22ce', '#be185d', '#0f766e'];
    let index = 0;
    for (const [name, entries] of groups) {
        const color = colors[index++ % colors.length];
        const coords = entries.map(entry => {
            const time = new Date(entry.occurred_at).getTime();
            return [45 + (maxTime === minTime ? 370 : (time - minTime) / (maxTime - minTime) * 740),
                220 - (entry.after_stock - entry.after_reserved) / maxValue * 200];
        });
        const polyline = document.createElementNS(ns, 'polyline');
        polyline.setAttribute('points', coords.map(point => point.join(',')).join(' '));
        polyline.setAttribute('fill', 'none'); polyline.setAttribute('stroke', color); polyline.setAttribute('stroke-width', '2.5');
        polyline.setAttribute('stroke-linecap', 'round'); polyline.setAttribute('stroke-linejoin', 'round');
        svg.append(polyline);
        for (const [x, y] of coords) {
            const point = document.createElementNS(ns, 'circle');
            point.setAttribute('cx', String(x)); point.setAttribute('cy', String(y));
            point.setAttribute('r', '3'); point.setAttribute('fill', color); svg.append(point);
        }
        const item = document.createElement('span');
        item.style.color = color; item.textContent = `● ${name}`;
        legend.append(item);
    }
    const period = document.createElement('p');
    const format = time => new Date(time).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' });
    period.textContent = `Mouvements chargés du ${format(minTime)} au ${format(maxTime)} (heure de Madagascar).`;
    container.append(svg, legend, period);
}

$('stock-history-export').addEventListener('click', () => {
    if (!historyFilter) { message('Chargez les mouvements avant de les exporter.', true); return; }
    const context = {
        port: $('stock-history-port').textContent,
        filter: $('stock-history-applied').textContent,
        coverage: historyCursor ? 'Potentiellement partielle : mouvements chargés uniquement' : 'Mouvements chargés'
    };
    const blob = new Blob([historyCsv(historyRows, context)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'qbox-mouvements-charges.csv';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message(`${historyRows.length} mouvement(s) chargé(s) exporté(s)${historyCursor ? ' ; d’autres mouvements peuvent ne pas être inclus.' : '.'}`);
});
$('stock-history-print').addEventListener('click', () => {
    if (!historyFilter) { message('Chargez les mouvements avant d’imprimer.', true); return; }
    window.print();
});

async function refreshQuarantines() {
    const port = $('reference-port').value;
    const sequence = ++quarantineRequest;
    const rows = port ? await request('/rest/v1/rpc/qbox_list_quarantines', { selected_port: port }, true) : [];
    if (sequence !== quarantineRequest || port !== $('reference-port').value || !token) return;
    const list = $('quarantine-list');
    list.replaceChildren();
    if (!rows.length) list.textContent = 'Aucune quarantaine pour ce port.';
    for (const entry of rows) {
        const card = document.createElement('article');
        card.className = 'user';
        const title = document.createElement('p');
        title.textContent = `${entry.product_name} · Lot ${entry.lot} · ${entry.quantity} · ${entry.reason} · ${entry.status} · ${new Date(entry.created_at).toLocaleString('fr-FR')} · ${entry.id}`;
        card.append(title);
        for (const action of entry.actions) {
            const line = document.createElement('p');
            line.textContent = `${action.action} · ${new Date(action.performed_at).toLocaleString('fr-FR')} · ${action.performed_by_name || 'Nom non renseigné'}`;
            card.append(line);
        }
        if (entry.status === 'En quarantaine' && QBoxAuthPolicy.roleMatches(currentUser.role, ['admin', 'logistics'])) {
            for (const [resolution, label] of [['release', 'Remettre en stock'], ['destroy', 'Détruire']]) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.addEventListener('click', async () => {
                    if (quarantineSaving || !allowReferenceWrite('stock')) return;
                    const prompt = resolution === 'release'
                        ? `Confirmez-vous que le lot ${entry.lot} est conforme et peut être remis en stock ?`
                        : `Confirmez-vous la destruction de ${entry.quantity} unités du lot ${entry.lot} ?`;
                    if (!confirm(prompt)) return;
                    quarantineSaving = true;
                    button.disabled = true;
                    try {
                        await request('/rest/v1/rpc/qbox_resolve_quarantine', { selected_port: port, selected_quarantine: entry.id, resolution }, true);
                        await Promise.all([refreshStock(), refreshQuarantines()]);
                        message('Quarantaine clôturée.');
                    } catch (error) {
                        message(`${error.message} Vérifiez la liste avant de réessayer si la connexion a été interrompue.`, true);
                    } finally { quarantineSaving = false; button.disabled = false; }
                });
                card.append(button);
            }
        }
        list.append(card);
    }
}

$('quarantine-new').addEventListener('click', async () => {
    if (quarantineSaving || quarantineLoading || !allowReferenceWrite('stock')) return;
    if (!$('quarantine-form').hidden && !confirm('Abandonner la saisie de quarantaine en cours ?')) return;
    const port = $('reference-port').value;
    if (!port) { message('Sélectionnez un drone port.', true); return; }
    quarantineLoading = true;
    try {
        await refreshStock();
        if (port !== $('reference-port').value || !token) return;
        const form = $('quarantine-form');
        form.reset();
        form.elements.stock.replaceChildren();
        for (const lot of stockLots.filter(item => item.available > 0)) {
            form.elements.stock.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible : ${lot.available}`, lot.id));
        }
        if (!form.elements.stock.options.length) { message('Aucun lot disponible.', true); return; }
        form.dataset.requestId = crypto.randomUUID();
        form.dataset.port = port;
        $('quarantine-request-id').textContent = `Identifiant de la demande : ${form.dataset.requestId}`;
        form.hidden = false;
    } catch (error) { message(error.message, true); }
    finally { quarantineLoading = false; }
});
$('quarantine-cancel').addEventListener('click', () => { if (!quarantineSaving) $('quarantine-form').hidden = true; });
$('quarantine-refresh').addEventListener('click', () => Promise.all([refreshStock(), refreshQuarantines()]).catch(error => message(error.message, true)));
$('quarantine-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (quarantineSaving || !allowReferenceWrite('stock')) return;
    const form = event.currentTarget;
    const amount = Number(form.elements.quantity.value);
    if (!Number.isSafeInteger(amount) || amount <= 0) { message('Quantité invalide.', true); return; }
    const port = form.dataset.port;
    if (port !== $('reference-port').value) { message('Le port a changé : recommencez.', true); return; }
    quarantineSaving = true;
    try {
        await request('/rest/v1/rpc/qbox_quarantine_stock', {
            request_id: form.dataset.requestId, selected_port: port, selected_stock: form.elements.stock.value,
            amount, quarantine_reason: form.elements.reason.value
        }, true);
        form.hidden = true;
        await Promise.all([refreshStock(), refreshQuarantines()]);
        message('Lot mis en quarantaine.');
    } catch (error) {
        message(`${error.message} Si la connexion a été interrompue, vérifiez la liste avant de créer une nouvelle demande.`, true);
    } finally { quarantineSaving = false; }
});

function clearInventoryPrintReport() {
    document.body.classList.remove('print-inventory');
    $('inventory-print-report').hidden = true;
    $('inventory-print-report').replaceChildren();
}

function printInventoryReport(inventory, portName) {
    const report = $('inventory-print-report');
    renderInventoryReport(inventory, portName, report);
    report.hidden = false;
    document.body.classList.add('print-inventory');
    window.print();
}
window.addEventListener('afterprint', clearInventoryPrintReport);

async function refreshInventories() {
    const port = $('reference-port').value;
    const sequence = ++inventoryRequest;
    const rows = port ? await request('/rest/v1/rpc/qbox_list_inventories', { selected_port: port }, true) : [];
    if (sequence !== inventoryRequest || port !== $('reference-port').value || !token) return;
    const list = $('inventory-list');
    list.replaceChildren();
    if (!rows.length) list.textContent = 'Aucun inventaire pour ce port.';
    for (const inventory of rows) {
        const card = document.createElement('article');
        card.className = 'user';
        const title = document.createElement('p');
        title.textContent = `${new Date(inventory.created_at).toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' })} (heure de Madagascar) · ${inventory.created_by_name || 'Nom non renseigné'} · ${inventory.id}`;
        card.append(title);
        if (inventory.observations) {
            const note = document.createElement('p');
            note.style.whiteSpace = 'pre-wrap';
            note.textContent = `Remarques et observations : ${inventory.observations}`;
            card.append(note);
        }
        card.append(inventoryReportTable(inventory.items));
        const print = document.createElement('button');
        print.type = 'button';
        print.textContent = 'Imprimer ce rapport';
        print.addEventListener('click', () => {
            if (port !== $('reference-port').value || !token) {
                message('Le port ou la session a changé : actualisez les inventaires.', true);
                return;
            }
            const portName = ports.find(item => item.id === port)?.name || port;
            printInventoryReport(inventory, portName);
        });
        card.append(print);
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'Afficher le détail par lot';
        details.append(summary);
        for (const item of inventory.items) {
            const line = document.createElement('p');
            line.textContent = `${item.product_name} · Lot ${item.lot} · Stock système : ${item.system_quantity} · En vol : ${item.in_delivery} · Compté : ${item.counted} · Écart : ${item.difference}`;
            details.append(line);
        }
        card.append(details);
        list.append(card);
    }
}

$('inventory-new').addEventListener('click', async () => {
    if (inventorySaving || !allowReferenceWrite('stock')) return;
    if (inventoryDraft && !confirm("Abandonner le comptage en cours et prendre un nouvel instantané ?")) return;
    const port = $('reference-port').value;
    if (!port) { message('Sélectionnez un drone port.', true); return; }
    const sequence = ++inventorySnapshotRequest;
    try {
        const snapshot = await request('/rest/v1/rpc/qbox_inventory_snapshot', { selected_port: port }, true);
        if (sequence !== inventorySnapshotRequest || port !== $('reference-port').value || !token) return;
        if (!snapshot.items.length) { message('Aucun lot à inventorier.', true); return; }
        inventoryDraft = { port, revision: snapshot.revision, id: crypto.randomUUID(), items: snapshot.items };
        $('inventory-observations').value = '';
        $('inventory-request-id').textContent = `Identifiant de la demande : ${inventoryDraft.id}`;
        const container = $('inventory-items');
        container.replaceChildren();
        for (const item of snapshot.items) {
            const row = document.createElement('div');
            row.className = 'user';
            const info = document.createElement('p');
            info.textContent = `${item.product_name} · Lot ${item.lot} · Stock système : ${item.system_quantity} · En vol : ${item.in_delivery} · Attendu : ${item.expected}`;
            const label = document.createElement('label');
            label.textContent = 'Quantité physiquement comptée';
            const input = document.createElement('input');
            input.type = 'number'; input.min = '0'; input.max = '9007199254740991'; input.step = '1'; input.required = true;
            input.dataset.stockId = item.stock_id;
            const difference = document.createElement('p');
            difference.textContent = 'Écart : à renseigner';
            input.addEventListener('input', () => {
                const value = Number(input.value);
                difference.textContent = input.value !== '' && Number.isSafeInteger(value) && value >= 0
                    ? `Écart : ${value - item.expected}` : 'Écart : à renseigner';
            });
            label.append(input);
            row.append(info, label, difference);
            container.append(row);
        }
        $('inventory-form').hidden = false;
    } catch (error) { message(error.message, true); }
});
$('inventory-cancel').addEventListener('click', () => {
    if (inventorySaving) return;
    inventorySnapshotRequest++;
    inventoryDraft = null;
    $('inventory-form').hidden = true;
});
$('inventory-refresh').addEventListener('click', () => refreshInventories().catch(error => message(error.message, true)));
$('inventory-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (inventorySaving || !inventoryDraft || !allowReferenceWrite('stock')) return;
    const draft = inventoryDraft;
    if (draft.port !== $('reference-port').value) { message('Le port a changé : recommencez.', true); return; }
    const inputs = [...$('inventory-items').querySelectorAll('input')];
    if (inputs.some(input => input.value === '' || !Number.isSafeInteger(Number(input.value)) || Number(input.value) < 0)) {
        message('Renseignez une quantité entière valide pour chaque lot.', true); return;
    }
    if (!confirm("Valider cet inventaire et ajuster les stocks du port ?")) return;
    inventorySaving = true;
    $('inventory-observations').disabled = true;
    try {
        await request('/rest/v1/rpc/qbox_submit_inventory', {
            request_id: draft.id, selected_port: draft.port, expected_revision: draft.revision,
            counts: inputs.map(input => ({ stock_id: input.dataset.stockId, counted: Number(input.value) })),
            inventory_observations: $('inventory-observations').value.trim()
        }, true);
        if (inventoryDraft === draft) { inventoryDraft = null; $('inventory-form').hidden = true; }
        await Promise.all([refreshStock(), refreshInventories()]);
        message('Inventaire validé.');
    } catch (error) {
        message(`${error.message} Si la connexion a été interrompue, vérifiez l'historique avant de recommencer.`, true);
    } finally {
        inventorySaving = false;
        $('inventory-observations').disabled = false;
    }
});

function addReceiptItem() {
    const row = document.createElement('div');
    row.className = 'user receipt-item';
    const productLabel = document.createElement('label');
    productLabel.textContent = 'Intrant';
    const product = document.createElement('select');
    product.name = 'product';
    product.required = true;
    for (const item of products) product.add(new Option(`${item.code} · ${item.name}`, item.id));
    productLabel.append(product);
    row.append(productLabel);
    for (const [label, name, type] of [['Lot', 'lot', 'text'], ['Date de péremption', 'expiry', 'date'], ['Quantité', 'quantity', 'number']]) {
        const field = document.createElement('label');
        field.textContent = label;
        const input = document.createElement('input');
        input.name = name;
        input.type = type;
        input.required = true;
        if (name === 'lot') input.maxLength = 120;
        if (name === 'quantity') { input.min = '1'; input.max = '9007199254740991'; input.step = '1'; }
        field.append(input);
        row.append(field);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Retirer cet intrant';
    remove.addEventListener('click', () => row.remove());
    row.append(remove);
    $('receipt-items').append(row);
}

$('receipt-new').addEventListener('click', () => {
    if (receiptSaving || planningSaving) return;
    if (!allowReferenceWrite('stock')) return;
    if (!$('reference-port').value || !products.length) {
        message("Un port et au moins un intrant sont nécessaires.", true);
        return;
    }
    $('receipt-form').reset();
    $('receipt-items').replaceChildren();
    receiptRequestId = crypto.randomUUID();
    addReceiptItem();
    $('receipt-form').hidden = false;
});
$('receipt-add').addEventListener('click', addReceiptItem);
$('receipt-cancel').addEventListener('click', () => { if (!receiptSaving) $('receipt-form').hidden = true; });
$('stock-refresh').addEventListener('click', () => refreshStock().catch(error => message(error.message, true)));
$('receipt-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('stock') || receiptSaving || planningSaving) return;
    const form = event.currentTarget;
    const port = $('reference-port').value;
    const items = [...$('receipt-items').querySelectorAll('.receipt-item')].map(row => ({
        product_id: row.querySelector('[name=product]').value,
        lot: row.querySelector('[name=lot]').value.trim(),
        expiry_date: row.querySelector('[name=expiry]').value,
        quantity: Number(row.querySelector('[name=quantity]').value)
    }));
    if (!items.length || items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
        message('Ajoutez au moins un intrant avec une quantité entière valide.', true);
        return;
    }
    if (!confirm(`Enregistrer cette réception de ${items.length} ligne(s) pour le port sélectionné ?`)) return;
    receiptSaving = true;
    $('receipt-submit').disabled = true;
    $('receipt-new').disabled = true;
    $('receipt-add').disabled = true;
    $('receipt-cancel').disabled = true;
    $('reference-port').disabled = true;
    try {
        await request('/rest/v1/rpc/qbox_receive_stock', {
            request_id: receiptRequestId, selected_port: port,
            receipt_reference: form.elements.reference.value.trim(), items
        }, true);
        form.hidden = true;
        await refreshStock();
        message('Réception enregistrée. Stocks mis à jour.');
    } catch (error) {
        message(`${error.message} Vérifiez les réceptions avant toute nouvelle saisie en cas de perte de connexion.`, true);
    } finally {
        receiptSaving = false;
        $('receipt-submit').disabled = false;
        $('receipt-new').disabled = false;
        $('receipt-add').disabled = false;
        $('receipt-cancel').disabled = false;
        $('reference-port').disabled = false;
    }
});

async function refreshPlannings() {
    const port = $('reference-port').value;
    const sequence = ++planningRequest;
    const result = port ? await request('/rest/v1/rpc/qbox_list_plannings', { selected_port: port }, true) : [];
    if (sequence !== planningRequest || port !== $('reference-port').value) return;
    plans = result;
    if (!$('flight-form').hidden) updateFlightNeeds();
    if (!$('shipment-form').hidden) updateShipmentNeeds();
    const container = $('planning-list');
    container.replaceChildren();
    if (!plans.length) container.textContent = 'Aucun planning pour ce port.';
    for (const plan of plans) {
        const card = document.createElement('article');
        card.className = 'user';
        const title = document.createElement('h3');
        title.textContent = `${plan.code} · ${plan.start_date} au ${plan.end_date} · ${plan.status}${plan.folder ? ` · ${plan.folder}` : ''}`;
        card.append(title);
        for (const item of plan.items) {
            const line = document.createElement('p');
            line.textContent = `${item.csb_name} · ${item.product_name} · Prévu : ${item.planned} · Livré : ${item.delivered} · En vol : ${item.in_flight} · En transit terrestre : ${item.in_transit} · Restant : ${item.remaining}`;
            card.append(line);
        }
        const destinations = new Map(plan.items.map(item => [item.csb_id, item.csb_name]));
        for (const [csbId, csbName] of destinations) {
            const print = document.createElement('button');
            print.type = 'button';
            print.textContent = `Imprimer les besoins : ${csbName}`;
            print.addEventListener('click', () => printPlanningNeeds(port, plan.id, csbId));
            card.append(print);
        }
        const historyButton = document.createElement('button');
        historyButton.type = 'button';
        historyButton.textContent = 'Afficher l’historique des modifications';
        const history = document.createElement('div');
        history.setAttribute('aria-live', 'polite');
        historyButton.addEventListener('click', async () => {
            const sequence = planningRequest, requestGeneration = sessionGeneration;
            if (historyButton.disabled || port !== $('reference-port').value || !token) return;
            historyButton.disabled = true;
            history.textContent = 'Chargement de l’historique…';
            try {
                const changes = await request('/rest/v1/rpc/qbox_planning_history', {selected_port:port, selected_planning:plan.id}, true);
                if (sequence !== planningRequest || port !== $('reference-port').value || sessionGeneration !== requestGeneration) return;
                renderPlanningHistoryEntries(history, changes);
            } catch (error) {
                if (sequence === planningRequest && port === $('reference-port').value && sessionGeneration === requestGeneration)
                    history.textContent = `Impossible de charger l’historique : ${error.message}`;
            } finally { historyButton.disabled = false; }
        });
        card.append(historyButton, history);
        if (plan.status === 'En cours') {
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Modifier la campagne';
            edit.addEventListener('click', () => openPlanningForm(plan));
            const archive = document.createElement('button');
            archive.type = 'button';
            archive.textContent = 'Archiver';
            const folderLabel = document.createElement('label');
            folderLabel.textContent = "Dossier d'archive";
            const folderInput = document.createElement('input');
            folderInput.type = 'text';
            folderInput.maxLength = 150;
            folderInput.value = 'Archives Générales';
            folderLabel.append(folderInput);
            archive.addEventListener('click', async () => {
                if (!allowReferenceWrite('planning') || planningSaving || receiptSaving) return;
                const folder = folderInput.value;
                if (!folder.trim()) { message("Le nom du dossier est requis.", true); return; }
                if (!confirm(`Archiver la campagne ${plan.code} ?`)) return;
                archive.disabled = true;
                try {
                    await request('/rest/v1/rpc/qbox_archive_planning', {
                        planning_id: plan.id, selected_port: port, expected_version: plan.version, folder_name: folder.trim()
                    }, true);
                    $('planning-form').hidden = true;
                    await refreshPlannings();
                    message('Campagne archivée.');
                } catch (error) {
                    message(`${error.message} Actualisez les plannings pour vérifier le résultat.`, true);
                } finally { archive.disabled = false; }
            });
            const actions = document.createElement('div');
            actions.className = 'actions';
            actions.append(edit, folderLabel, archive);
            card.append(actions);
        }
        container.append(card);
    }
}

function addPlanningItem(item = null) {
    const row = document.createElement('div');
    row.className = 'user planning-item';
    for (const [label, name, options, selected] of [
        ['CSB', 'csb', csbs, item?.csb_id],
        ['Intrant', 'product', products, item?.product_id]
    ]) {
        const field = document.createElement('label');
        field.textContent = label;
        const select = document.createElement('select');
        select.name = name;
        select.required = true;
        for (const option of options) select.add(new Option(`${option.code} · ${option.name}`, option.id));
        if (selected) select.value = selected;
        field.append(select);
        row.append(field);
    }
    const field = document.createElement('label');
    field.textContent = 'Quantité prévue';
    const quantity = document.createElement('input');
    quantity.name = 'quantity';
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = '9007199254740991';
    quantity.step = '1';
    quantity.required = true;
    if (item) quantity.value = item.planned;
    field.append(quantity);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Retirer la ligne';
    remove.addEventListener('click', () => row.remove());
    row.append(field, remove);
    $('planning-items').append(row);
}

function openPlanningForm(plan = null) {
    if (!allowReferenceWrite('planning') || planningSaving) return;
    if (!$('reference-port').value || !csbs.length || !products.length) {
        message('Un port, un CSB et un intrant sont nécessaires.', true);
        return;
    }
    editingPlanning = plan ? { id: plan.id, version: plan.version } : { id: crypto.randomUUID(), version: null };
    const form = $('planning-form');
    form.reset();
    $('planning-observations').value = '';
    $('planning-observations-wrapper-admin').hidden = !plan;
    form.elements.start.value = plan?.start_date || '';
    form.elements.end.value = plan?.end_date || '';
    $('planning-heading').textContent = plan ? 'Modifier la campagne' : 'Nouvelle campagne';
    $('planning-items').replaceChildren();
    if (plan) plan.items.forEach(addPlanningItem); else addPlanningItem();
    form.hidden = false;
}

$('planning-new').addEventListener('click', () => openPlanningForm());
$('planning-add').addEventListener('click', () => addPlanningItem());
$('planning-cancel').addEventListener('click', () => { if (!planningSaving) $('planning-form').hidden = true; });
$('planning-refresh').addEventListener('click', () => refreshPlannings().catch(error => message(error.message, true)));
$('planning-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('planning') || planningSaving || receiptSaving || !editingPlanning) return;
    const form = event.currentTarget;
    const items = [...$('planning-items').querySelectorAll('.planning-item')].map(row => ({
        csb_id: row.querySelector('[name=csb]').value,
        product_id: row.querySelector('[name=product]').value,
        quantity: Number(row.querySelector('[name=quantity]').value)
    }));
    if (!items.length || items.some(item => !item.csb_id || !item.product_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
        message('Ajoutez au moins une ligne avec une quantité entière valide.', true);
        return;
    }
    if (form.elements.start.value > form.elements.end.value) {
        message('La date de début doit précéder ou égaler la date de fin.', true);
        return;
    }
    const port = $('reference-port').value;
    planningSaving = true;
    for (const id of ['planning-submit', 'planning-new', 'planning-add', 'planning-cancel', 'planning-observations', 'reference-port']) $(id).disabled = true;
    try {
        await request('/rest/v1/rpc/qbox_save_planning', {
            planning_id: editingPlanning.id, selected_port: port, expected_version: editingPlanning.version,
            start_date: form.elements.start.value, end_date: form.elements.end.value, items,
            observations: $('planning-observations').value.trim() || null
        }, true);
        form.hidden = true;
        await refreshPlannings();
        message('Campagne enregistrée.');
    } catch (error) {
        message(`${error.message} Actualisez les plannings pour vérifier le résultat avant une nouvelle saisie.`, true);
    } finally {
        planningSaving = false;
        for (const id of ['planning-submit', 'planning-new', 'planning-add', 'planning-cancel', 'planning-observations', 'reference-port']) $(id).disabled = false;
    }
});

function clearFlightPrintReport() {
    flightPrintRequest++;
    document.body.classList.remove('print-flight');
    $('flight-print-report').hidden = true;
    $('flight-print-report').className = '';
    $('flight-print-report').replaceChildren();
}

function renderDeliveryPrintReport(delivery, port, kind, stocks, planning, csb) {
    const report = $('flight-print-report');
    report.replaceChildren();
    report.className = 'delivery-print-report';
    const flight = kind === 'flight';
    const reference = flight ? delivery.bl : delivery.reference;
    const header = document.createElement('header');
    header.className = 'delivery-report-header';
    const ministry = document.createElement('img');
    ministry.src = 'logo-msanp.png';
    ministry.alt = 'Logo du Ministère de la Santé publique';
    const references = document.createElement('div');
    for (const [tag, value] of [
        ['h1', 'BON DE LIVRAISON'], ['p', reference],
        ['p', `Date d'impression : ${new Date().toLocaleDateString('fr-FR', { timeZone: 'Indian/Antananarivo' })}`]
    ]) {
        const node = document.createElement(tag);
        node.textContent = value;
        references.append(node);
    }
    const unfpa = document.createElement('img');
    unfpa.src = 'logo-unfpa.svg';
    unfpa.alt = 'Logo UNFPA';
    header.append(ministry, references, unfpa);
    report.append(header);
    const details = document.createElement('div');
    details.className = 'delivery-report-details';
    for (const lines of [
        ['EXPÉDITEUR', `Origine : ${port.name}`, `Région : ${port.region}`, `Planning : ${delivery.planning_code}`,
            `Période du planning : ${planning ? `${planning.start_date} au ${planning.end_date}` : 'Non renseignée'}`],
        ['FORMATION SANITAIRE', `Destination : ${delivery.csb_name}`, `Région : ${csb?.region || 'Non renseignée'}`,
            `District sanitaire : ${csb?.district || 'Non renseigné'}`, `Acheminement : ${flight ? 'Drone' : delivery.transport}`]
    ]) {
        const section = document.createElement('div');
        for (const line of lines) {
            const node = document.createElement('p');
            node.textContent = line;
            section.append(node);
        }
        details.append(section);
    }
    report.append(details);
    const articles = deliveryArticleRows(delivery.items, stocks);
    report.append(dashboardReportTable(['Articles', 'Désignation', 'N° lot', 'Date de péremption', 'Quantité'],
        articles.rows.map(item => [item.article, item.name, item.lot, item.expiry, BigInt(item.quantity).toLocaleString('fr-FR')])));
    const count = document.createElement('p');
    count.textContent = `Arrêté au nombre de ${articles.count} article(s).`;
    report.append(count);
    const signatures = document.createElement('div');
    signatures.className = 'delivery-report-signatures';
    for (const text of ['Expéditeur : signature', 'Destinataire : Date, Nom, Visa et Cachet du responsable']) {
        const signature = document.createElement('div');
        signature.textContent = text;
        signatures.append(signature);
    }
    report.append(signatures);
    return [ministry, unfpa];
}

function renderPlanningNeedsReport(plan, items, port) {
    const report = $('flight-print-report');
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
    report.append(dashboardReportTable(['Intrant', 'Prévu', 'Livré', 'En vol', 'Transit terrestre', 'Restant à prévoir'],
        items.map(item => [item.product_name, ...['planned', 'delivered', 'in_flight', 'in_transit', 'remaining']
            .map(key => BigInt(item[key]).toLocaleString('fr-FR'))])));
}

async function printPlanningNeeds(port, planId, csbId) {
    clearFlightPrintReport();
    const sequence = flightPrintRequest;
    try {
        const currentPlans = await request('/rest/v1/rpc/qbox_list_plannings', { selected_port: port }, true);
        if (sequence !== flightPrintRequest || port !== $('reference-port').value || !token) return;
        const plan = currentPlans.find(item => item.id === planId);
        const items = plan?.items.filter(item => item.csb_id === csbId) || [];
        if (!plan || !items.length) throw new Error('Besoins introuvables : actualisez la liste des plannings.');
        const selectedPort = ports.find(item => item.id === port);
        if (!selectedPort) throw new Error('Drone port introuvable : actualisez les références.');
        renderPlanningNeedsReport(plan, items, selectedPort);
        $('flight-print-report').hidden = false;
        document.body.classList.add('print-flight');
        window.print();
    } catch (error) {
        if (sequence !== flightPrintRequest && error.message !== 'Session expirée : reconnectez-vous.') return;
        message(`Impossible d’imprimer les besoins : ${error.message}`, true);
    }
}

async function printDeliveryReport(port, deliveryId, kind) {
    clearFlightPrintReport();
    const sequence = flightPrintRequest;
    try {
        const flight = kind === 'flight';
        const deliveries = await request(`/rest/v1/rpc/qbox_list_${flight ? 'flights' : 'shipments'}`, { selected_port: port }, true);
        if (sequence !== flightPrintRequest || port !== $('reference-port').value || !token) return;
        const delivery = deliveries.find(item => item.id === deliveryId);
        if (!delivery) throw new Error('Opération introuvable : actualisez la liste.');
        if (![flight ? 'En vol' : 'En cours', 'Clôturé'].includes(delivery.status))
            throw new Error('Une opération annulée ou de statut inconnu ne peut pas produire un bon de livraison.');
        const selectedPort = ports.find(item => item.id === port);
        if (!selectedPort) throw new Error('Drone port introuvable : actualisez les références.');
        const [stocks, plannings, csbs] = await Promise.all([
            request('/rest/v1/rpc/qbox_list_stocks', { selected_port: port }, true),
            request('/rest/v1/rpc/qbox_list_plannings', { selected_port: port }, true),
            request('/rest/v1/rpc/qbox_list_csbs', { selected_port: port }, true)
        ]);
        if (sequence !== flightPrintRequest || port !== $('reference-port').value || !token) return;
        const logos = renderDeliveryPrintReport(delivery, selectedPort, kind, stocks,
            plannings.find(item => item.id === delivery.planning_id), csbs.find(item => item.id === delivery.csb_id));
        await Promise.all(logos.map(logo => logo.decode()));
        if (sequence !== flightPrintRequest || port !== $('reference-port').value || !token) return;
        $('flight-print-report').hidden = false;
        document.body.classList.add('print-flight');
        window.print();
    } catch (error) {
        if (sequence !== flightPrintRequest && error.message !== 'Session expirée : reconnectez-vous.') return;
        message(`Impossible d’imprimer le BL : ${error.message}`, true);
    }
}
window.addEventListener('afterprint', clearFlightPrintReport);

async function refreshFlights() {
    const port = $('reference-port').value;
    const sequence = ++flightRequest;
    const flights = port ? await request('/rest/v1/rpc/qbox_list_flights', { selected_port: port }, true) : [];
    if (sequence !== flightRequest || port !== $('reference-port').value) return;
    const container = $('flight-list');
    container.replaceChildren();
    if (!flights.length) container.textContent = 'Aucun vol pour ce port.';
    for (const flight of flights) {
        const card = document.createElement('article');
        card.className = 'user flight-operation-card';
        const title = document.createElement('h3');
        title.className = 'flight-operation-reference';
        title.textContent = flight.bl;
        const meta = document.createElement('p');
        meta.className = 'flight-operation-meta';
        meta.textContent = `${flight.csb_name} · Planning ${flight.planning_code}${flight.closed_date ? ` · Clôture : ${flight.closed_date}` : ''}`;
        const badge = document.createElement('span');
        badge.className = `flight-operation-status ${flight.status === 'En vol' ? 'flight-status-active' : flight.status === 'Annulé' ? 'flight-status-cancelled' : 'flight-status-closed'}`;
        badge.textContent = flight.status;
        const heading = document.createElement('div');
        heading.className = 'flight-operation-heading';
        const identity = document.createElement('div');
        identity.append(title, meta);
        heading.append(identity, badge);
        card.append(heading);
        const contents = document.createElement('div');
        contents.className = 'flight-operation-items';
        for (const item of flight.items) {
            const line = document.createElement('p');
            line.textContent = `${item.product_name} · Lot ${item.lot} · Quantité : ${item.quantity}`;
            contents.append(line);
        }
        if (!flight.items.length) contents.textContent = 'Aucun détail de colis.';
        card.append(contents);
        const actions = document.createElement('div');
        actions.className = 'flight-operation-actions';
        if (flight.status !== 'Annulé') {
            const print = document.createElement('button');
            print.type = 'button';
            print.textContent = 'Imprimer le BL';
            print.addEventListener('click', () => printDeliveryReport(port, flight.id, 'flight'));
            print.className = 'flight-secondary';
            actions.append(print);
        }
        const history = document.createElement('div');
        history.className = 'flight-operation-history';
        const historyButton = document.createElement('button');
        historyButton.type = 'button';
        historyButton.textContent = 'Afficher l’historique des modifications';
        historyButton.className = 'flight-secondary';
        historyButton.addEventListener('click', async () => {
            try {
                const detail = await request('/rest/v1/rpc/qbox_flight_details', { selected_port: port, selected_flight: flight.id }, true);
                if (port !== $('reference-port').value || !token) return;
                history.replaceChildren();
                if (!detail.changes.length) history.textContent = 'Aucune modification enregistrée.';
                for (const change of detail.changes) {
                    const line = document.createElement('p');
                    const describe = items => items.map(item => {
                        const lot = stockLots.find(stock => stock.id === item.stock_id);
                        return `${lot ? `${lot.name} · Lot ${lot.lot}` : item.stock_id} : ${item.quantity}`;
                    }).join(' ; ') || 'aucun';
                    line.textContent = `${change.action} · ${new Date(change.performed_at).toLocaleString('fr-FR')} · ${change.performed_by_name || 'Nom non renseigné'} · Avant : ${describe(change.before_items)} · Après : ${describe(change.after_items)}`;
                    history.append(line);
                }
            } catch (error) { message(error.message, true); }
        });
        actions.append(historyButton);
        if (flight.status === 'En vol') {
            if (currentUser && QBoxAuthPolicy.roleMatches(currentUser.role, ['admin', 'pilot'])) {
                const edit = document.createElement('button');
                edit.type = 'button';
                edit.textContent = 'Modifier ce vol';
                edit.addEventListener('click', () => openFlightEdit(port, flight.id).catch(error => message(error.message, true)));
                const cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.textContent = 'Annuler ce vol';
                cancel.addEventListener('click', async () => {
                    if (flightSaving || !allowReferenceWrite('flight')) return;
                    flightSaving = true;
                    cancel.disabled = true;
                    try {
                        const detail = await request('/rest/v1/rpc/qbox_flight_details', { selected_port: port, selected_flight: flight.id }, true);
                        if (port !== $('reference-port').value || !token) return;
                        if (detail.status !== 'En vol') throw new Error('Ce vol n’est plus modifiable : actualisez la liste.');
                        if (!confirm(`Annuler ${detail.bl} et libérer ses réservations ?\nConfirmez le retour physique des produits au port.\n${describeFlightItems(detail.items)}\nLe vol et son BL resteront dans l’historique.`)) return;
                        await request('/rest/v1/rpc/qbox_cancel_flight_versioned', {
                            selected_port: port, selected_flight: flight.id, expected_version: detail.version, return_confirmed: true
                        }, true);
                        if (flightEdit?.id === flight.id) { flightEdit = null; $('flight-edit-form').hidden = true; }
                        await Promise.all([refreshFlights(), refreshStock(), refreshPlannings()]);
                        message('Vol annulé : réservations libérées.');
                    } catch (error) { message(`${error.message} Actualisez les vols pour vérifier le résultat.`, true); }
                    finally { flightSaving = false; cancel.disabled = false; }
                });
                edit.className = 'flight-secondary';
                cancel.className = 'flight-danger';
                actions.append(edit, cancel);
            }
            const label = document.createElement('label');
            label.textContent = 'Date de clôture';
            label.className = 'flight-close-date';
            const date = document.createElement('input');
            date.type = 'date';
            date.value = madagascarDate();
            label.append(date);
            const close = document.createElement('button');
            close.type = 'button';
            close.textContent = 'Clôturer ce vol';
            close.className = 'flight-success';
            close.addEventListener('click', async () => {
                if (!allowReferenceWrite('flight') || flightSaving) return;
                if (!date.value) { message('Indiquez une date de clôture.', true); return; }
                flightSaving = true;
                close.disabled = true;
                try {
                    const detail = await request('/rest/v1/rpc/qbox_flight_details', { selected_port: port, selected_flight: flight.id }, true);
                    if (port !== $('reference-port').value || !token) return;
                    if (detail.status !== 'En vol') throw new Error('Ce vol n’est plus modifiable : actualisez la liste.');
                    if (!confirm(`Clôturer le vol ${detail.bl} et déduire son colis du stock ?\n${describeFlightItems(detail.items)}`)) return;
                    await request('/rest/v1/rpc/qbox_close_flight_versioned', {
                        selected_port: port, selected_flight: flight.id, expected_version: detail.version, close_date: date.value
                    }, true);
                    if (flightEdit?.id === flight.id) { flightEdit = null; $('flight-edit-form').hidden = true; }
                    await Promise.all([refreshFlights(), refreshStock(), refreshPlannings()]);
                    message('Vol clôturé : stock et planning mis à jour.');
                } catch (error) {
                    message(`${error.message} Actualisez les vols pour vérifier le résultat.`, true);
                } finally { flightSaving = false; close.disabled = false; }
            });
            actions.append(label, close);
        }
        card.append(actions, history);
        container.append(card);
    }
}

function describeFlightItems(items) {
    return items.map(item => {
        const lot = stockLots.find(stock => stock.id === item.stock_id);
        return `${lot ? `${lot.name} · Lot ${lot.lot}` : item.stock_id} : ${item.quantity}`;
    }).join('\n');
}

function updateFlightEditNeeds() {
    if (!flightEdit) return;
    const plan = plans.find(item => item.id === flightEdit.planning_id);
    const draft = new Map();
    for (const row of $('flight-edit-items').querySelectorAll('.flight-item')) {
        const lot = stockLots.find(item => item.id === row.querySelector('[name=stock]').value);
        const quantity = Number(row.querySelector('[name=quantity]').value);
        if (lot && Number.isSafeInteger(quantity) && quantity > 0) draft.set(lot.product_id, (draft.get(lot.product_id) || 0) + quantity);
    }
    const needs = $('flight-edit-needs');
    needs.replaceChildren();
    for (const item of (plan?.items || []).filter(item => item.csb_id === flightEdit.csb_id)) {
        const own = flightEdit.items.reduce((sum, line) => {
            const lot = stockLots.find(stock => stock.id === line.stock_id);
            return sum + (lot?.product_id === item.product_id ? line.quantity : 0);
        }, 0);
        const remaining = item.remaining + own - (draft.get(item.product_id) || 0);
        const line = document.createElement('p');
        line.textContent = `${item.product_name} · Besoin restant après ce colis : ${remaining}`;
        needs.append(line);
    }
}

function addFlightEditItem(existing = null) {
    if (!flightEdit) return;
    const row = document.createElement('div');
    row.className = 'flight-item user';
    const label = document.createElement('label');
    label.textContent = 'Intrant et lot';
    const select = document.createElement('select');
    select.name = 'stock';
    select.required = true;
    const plan = plans.find(item => item.id === flightEdit.planning_id);
    const allowed = new Set((plan?.items || []).filter(item => item.csb_id === flightEdit.csb_id).map(item => item.product_id));
    for (const lot of stockLots.filter(item => allowed.has(item.product_id))) {
        const own = flightEdit.items.find(item => item.stock_id === lot.id)?.quantity || 0;
        if (lot.available + own > 0) select.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible pour ce vol : ${lot.available + own}`, lot.id));
    }
    if (!select.options.length) select.add(new Option('Aucun lot disponible', ''));
    if (existing) select.value = existing.stock_id;
    label.append(select);
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantité';
    const quantity = document.createElement('input');
    quantity.name = 'quantity'; quantity.type = 'number'; quantity.min = '1';
    quantity.max = '9007199254740991'; quantity.step = '1'; quantity.required = true;
    if (existing) quantity.value = existing.quantity;
    quantityLabel.append(quantity);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = 'Retirer cet intrant';
    remove.addEventListener('click', () => { row.remove(); updateFlightEditNeeds(); });
    select.addEventListener('change', updateFlightEditNeeds);
    quantity.addEventListener('input', updateFlightEditNeeds);
    row.append(label, quantityLabel, remove);
    $('flight-edit-items').append(row);
    updateFlightEditNeeds();
}

async function openFlightEdit(port, id) {
    if (flightSaving || !allowReferenceWrite('flight')) return;
    if (flightEdit && !confirm('Abandonner la modification de vol en cours ?')) return;
    const sequence = ++flightEditRequest;
    const [detail] = await Promise.all([
        request('/rest/v1/rpc/qbox_flight_details', { selected_port: port, selected_flight: id }, true),
        refreshStock(), refreshPlannings()
    ]);
    if (sequence !== flightEditRequest || port !== $('reference-port').value || !token) return;
    if (detail.status !== 'En vol') throw new Error('Ce vol n’est plus modifiable : actualisez la liste.');
    flightEdit = { ...detail, port };
    $('flight-edit-title').textContent = `Modifier le vol ${detail.bl}`;
    $('flight-edit-items').replaceChildren();
    for (const item of detail.items) addFlightEditItem(item);
    $('flight-edit-form').hidden = false;
}

$('flight-edit-add').addEventListener('click', () => addFlightEditItem());
$('flight-edit-cancel').addEventListener('click', () => {
    if (flightSaving) return;
    flightEditRequest++;
    flightEdit = null;
    $('flight-edit-form').hidden = true;
});
$('flight-edit-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (flightSaving || !flightEdit || !allowReferenceWrite('flight')) return;
    const draft = flightEdit;
    const items = [...$('flight-edit-items').querySelectorAll('.flight-item')].map(row => ({
        stock_id: row.querySelector('[name=stock]').value, quantity: Number(row.querySelector('[name=quantity]').value)
    }));
    if (!items.length || items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
        message('Ajoutez au moins un lot avec une quantité entière valide.', true); return;
    }
    if (!confirm(`Enregistrer le nouveau contenu du vol ${draft.bl} ?`)) return;
    flightSaving = true;
    const controls = [...event.currentTarget.querySelectorAll('input, select, button'), $('reference-port')];
    controls.forEach(control => { control.disabled = true; });
    try {
        await request('/rest/v1/rpc/qbox_edit_flight_versioned', {
            selected_port: draft.port, selected_flight: draft.id, expected_version: draft.version, items
        }, true);
        if (flightEdit === draft) { flightEdit = null; $('flight-edit-form').hidden = true; }
        await Promise.all([refreshFlights(), refreshStock(), refreshPlannings()]);
        message('Vol modifié : réservations et besoins mis à jour.');
    } catch (error) { message(`${error.message} Actualisez les vols avant de recommencer si le résultat est incertain.`, true); }
    finally { flightSaving = false; controls.forEach(control => { control.disabled = false; }); }
});

function updateFlightNeeds() {
    const form = $('flight-form');
    const plan = plans.find(item => item.id === form.elements.planning.value);
    const csb = form.elements.csb.value;
    const draft = new Map();
    for (const row of $('flight-parcels').querySelectorAll('.flight-item')) {
        const lot = stockLots.find(item => item.id === row.querySelector('[name=stock]').value);
        const value = Number(row.querySelector('[name=quantity]').value);
        if (lot && Number.isSafeInteger(value) && value > 0) {
            draft.set(lot.product_id, (draft.get(lot.product_id) || 0) + value);
        }
    }
    const container = $('flight-needs');
    container.replaceChildren();
    const needs = plan ? plan.items.filter(item => item.csb_id === csb) : [];
    if (!needs.length) container.textContent = 'Aucun besoin pour ce CSB.';
    for (const item of needs) {
        const line = document.createElement('p');
        const prepared = draft.get(item.product_id) || 0;
        const remaining = item.remaining - prepared;
        line.textContent = `${item.product_name} · Prévu : ${item.planned} · Livré : ${item.delivered} · En vol : ${item.in_flight} · Transit terrestre : ${item.in_transit} · Ces colis : ${prepared} · ${remaining < 0 ? `Dépassement : ${-remaining}` : `Restant : ${remaining}`}`;
        container.append(line);
    }
}

function addFlightItem(parcel) {
    const row = document.createElement('div');
    row.className = 'flight-item user';
    const label = document.createElement('label');
    label.textContent = 'Intrant et lot';
    const select = document.createElement('select');
    select.name = 'stock';
    select.required = true;
    const plan = plans.find(item => item.id === $('flight-form').elements.planning.value);
    const allowed = new Set((plan?.items || []).filter(item => item.csb_id === $('flight-form').elements.csb.value).map(item => item.product_id));
    for (const lot of stockLots.filter(item => allowed.has(item.product_id) && item.available > 0)) {
        select.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible : ${lot.available}`, lot.id));
    }
    if (!select.options.length) select.add(new Option('Aucun lot disponible pour ce CSB', ''));
    label.append(select);
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantité';
    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.name = 'quantity';
    quantity.min = '1';
    quantity.max = '9007199254740991';
    quantity.step = '1';
    quantity.required = true;
    quantityLabel.append(quantity);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Retirer cet intrant';
    remove.addEventListener('click', () => { row.remove(); updateFlightNeeds(); });
    row.append(label, quantityLabel, remove);
    parcel.querySelector('.flight-items').append(row);
    select.addEventListener('change', updateFlightNeeds);
    quantity.addEventListener('input', updateFlightNeeds);
}

function addFlightParcel() {
    const parcel = document.createElement('div');
    parcel.className = 'user flight-parcel';
    parcel.dataset.id = crypto.randomUUID();
    const title = document.createElement('h3');
    title.textContent = 'Un vol / un colis';
    const label = document.createElement('p');
    label.textContent = "Numéro BL : généré automatiquement à l'enregistrement.";
    const items = document.createElement('div');
    items.className = 'flight-items';
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Ajouter un intrant au colis';
    add.addEventListener('click', () => addFlightItem(parcel));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Retirer ce vol';
    remove.addEventListener('click', () => { parcel.remove(); updateFlightNeeds(); });
    parcel.append(title, label, items, add, remove);
    $('flight-parcels').append(parcel);
    addFlightItem(parcel);
}

function updateFlightCsbs() {
    const form = $('flight-form');
    const plan = plans.find(item => item.id === form.elements.planning.value);
    form.elements.csb.replaceChildren();
    const byId = new Map((plan?.items || []).map(item => [item.csb_id, item.csb_name]));
    for (const [id, name] of byId) form.elements.csb.add(new Option(name, id));
    $('flight-parcels').replaceChildren();
    updateFlightNeeds();
}

$('flight-new').addEventListener('click', async () => {
    if (!allowReferenceWrite('flight') || flightSaving) return;
    const port = $('reference-port').value;
    try {
        await Promise.all([refreshStock(), refreshPlannings()]);
        if (!currentUser || port !== $('reference-port').value) return;
        const form = $('flight-form');
        form.reset();
        form.elements.planning.replaceChildren();
        for (const plan of plans.filter(item => item.status === 'En cours')) {
            form.elements.planning.add(new Option(`${plan.code} · ${plan.start_date} au ${plan.end_date}`, plan.id));
        }
        if (!form.elements.planning.value) { message('Un planning actif est nécessaire.', true); return; }
        updateFlightCsbs();
        addFlightParcel();
        form.hidden = false;
        updateFlightNeeds();
    } catch (error) { message(error.message, true); }
});
$('flight-form').elements.planning.addEventListener('change', updateFlightCsbs);
$('flight-form').elements.csb.addEventListener('change', () => {
    $('flight-parcels').replaceChildren();
    updateFlightNeeds();
});
$('flight-add').addEventListener('click', addFlightParcel);
$('flight-cancel').addEventListener('click', () => { if (!flightSaving) $('flight-form').hidden = true; });
$('flight-refresh').addEventListener('click', () => Promise.all([refreshFlights(), refreshStock(), refreshPlannings()]).catch(error => message(error.message, true)));
$('flight-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('flight') || flightSaving) return;
    const form = event.currentTarget;
    const flights = [...$('flight-parcels').querySelectorAll('.flight-parcel')].map(parcel => ({
        id: parcel.dataset.id,
        items: [...parcel.querySelectorAll('.flight-item')].map(row => ({
            stock_id: row.querySelector('[name=stock]').value,
            quantity: Number(row.querySelector('[name=quantity]').value)
        }))
    }));
    if (!form.elements.csb.value || !flights.length || flights.some(f => !f.items.length ||
        f.items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0))) {
        message('Ajoutez un CSB et au moins un colis avec des lots et des quantités valides.', true);
        return;
    }
    if (!confirm(`Enregistrer ${flights.length} vol(s) et réserver les quantités ?`)) return;
    flightSaving = true;
    const controls = [...form.querySelectorAll('input, select, button'), $('flight-new'), $('reference-port')];
    controls.forEach(control => { control.disabled = true; });
    try {
        await request('/rest/v1/rpc/qbox_create_flights', {
            selected_port: $('reference-port').value, selected_planning: form.elements.planning.value,
            selected_csb: form.elements.csb.value, flights
        }, true);
        form.hidden = true;
        await Promise.all([refreshFlights(), refreshStock(), refreshPlannings()]);
        message('Vols enregistrés et stocks réservés.');
    } catch (error) {
        message(`${error.message} Actualisez les vols et les stocks avant une nouvelle saisie en cas de perte de connexion.`, true);
    } finally {
        flightSaving = false;
        controls.forEach(control => { control.disabled = false; });
    }
});

async function refreshShipments() {
    const port = $('reference-port').value;
    const sequence = ++shipmentRequest;
    const shipments = port ? await request('/rest/v1/rpc/qbox_list_shipments', { selected_port: port }, true) : [];
    if (sequence !== shipmentRequest || port !== $('reference-port').value) return;
    const container = $('shipment-list');
    container.replaceChildren();
    if (!shipments.length) container.textContent = 'Aucune expédition pour ce port.';
    for (const shipment of shipments) {
        const card = document.createElement('article');
        card.className = 'user';
        const title = document.createElement('h3');
        title.textContent = `${shipment.reference} · ${shipment.csb_name} · ${shipment.planning_code} · ${shipment.transport} · ${shipment.status}${shipment.closed_date ? ` · ${shipment.closed_date}` : ''}`;
        card.append(title);
        for (const item of shipment.items) {
            const line = document.createElement('p');
            line.textContent = `${item.product_name} · Lot ${item.lot} · Quantité : ${item.quantity}`;
            card.append(line);
        }
        if (shipment.status !== 'Annulé') {
            const print = document.createElement('button');
            print.type = 'button';
            print.textContent = 'Imprimer le BL';
            print.addEventListener('click', () => printDeliveryReport(port, shipment.id, 'shipment'));
            card.append(print);
        }
        const history = document.createElement('div');
        const historyButton = document.createElement('button');
        historyButton.type = 'button';
        historyButton.textContent = 'Afficher l’historique de l’expédition';
        historyButton.addEventListener('click', async () => {
            try {
                const detail = await request('/rest/v1/rpc/qbox_shipment_details', { selected_port: port, selected_shipment: shipment.id }, true);
                if (port !== $('reference-port').value || !token) return;
                history.replaceChildren();
                if (!detail.changes.length) history.textContent = 'Aucune modification enregistrée.';
                for (const change of detail.changes) {
                    const line = document.createElement('p');
                    line.textContent = `${change.action} · ${new Date(change.performed_at).toLocaleString('fr-FR')} · ${change.performed_by_name || 'Nom non renseigné'} · Transport : ${change.before_transport} → ${change.after_transport} · Avant : ${describeFlightItems(change.before_items) || 'aucun'} · Après : ${describeFlightItems(change.after_items) || 'aucun'}${change.return_confirmed ? ' · Retour physique et conformité confirmés' : ''}`;
                    history.append(line);
                }
            } catch (error) { message(error.message, true); }
        });
        card.append(historyButton, history);
        if (shipment.status === 'En cours') {
            if (currentUser && QBoxAuthPolicy.roleMatches(currentUser.role, ['admin', 'logistics'])) {
                const edit = document.createElement('button');
                edit.type = 'button';
                edit.textContent = 'Modifier cette expédition';
                edit.addEventListener('click', () => openShipmentEdit(port, shipment.id).catch(error => message(error.message, true)));
                const cancel = document.createElement('button');
                cancel.type = 'button';
                cancel.textContent = 'Annuler cette expédition';
                cancel.addEventListener('click', async () => {
                    if (shipmentSaving || !allowReferenceWrite('shipment')) return;
                    shipmentSaving = true;
                    cancel.disabled = true;
                    try {
                        const detail = await request('/rest/v1/rpc/qbox_shipment_details', { selected_port: port, selected_shipment: shipment.id }, true);
                        if (port !== $('reference-port').value || !token) return;
                        if (detail.status !== 'En cours') throw new Error('Cette expédition n’est plus modifiable : actualisez la liste.');
                        if (!confirm(`Annuler ${detail.reference} ? Confirmez que tous ces produits sont physiquement revenus au port et conformes avant leur remise en stock :\n${describeFlightItems(detail.items)}`)) return;
                        await request('/rest/v1/rpc/qbox_change_shipment', {
                            selected_port: port, selected_shipment: shipment.id, expected_version: detail.version,
                            action: 'cancel', transport_name: null, items: null, return_confirmed: true
                        }, true);
                        if (shipmentEdit?.id === shipment.id) { shipmentEdit = null; $('shipment-edit-form').hidden = true; }
                        await Promise.all([refreshShipments(), refreshStock(), refreshPlannings()]);
                        message('Expédition annulée : produits remis en stock.');
                    } catch (error) { message(`${error.message} Actualisez les expéditions pour vérifier le résultat.`, true); }
                    finally { shipmentSaving = false; cancel.disabled = false; }
                });
                card.append(edit, cancel);
            }
            const label = document.createElement('label');
            label.textContent = 'Date de clôture';
            const date = document.createElement('input');
            date.type = 'date';
            date.value = madagascarDate();
            label.append(date);
            const close = document.createElement('button');
            close.type = 'button';
            close.textContent = "Clôturer l'expédition";
            close.addEventListener('click', async () => {
                if (!allowReferenceWrite('shipment') || shipmentSaving) return;
                if (!date.value) { message('Indiquez une date de clôture.', true); return; }
                shipmentSaving = true;
                close.disabled = true;
                try {
                    const detail = await request('/rest/v1/rpc/qbox_shipment_details', { selected_port: port, selected_shipment: shipment.id }, true);
                    if (port !== $('reference-port').value || !token) return;
                    if (detail.status !== 'En cours') throw new Error('Cette expédition n’est plus modifiable : actualisez la liste.');
                    if (!confirm(`Clôturer l'expédition ${detail.reference} ?\n${describeFlightItems(detail.items)}`)) return;
                    await request('/rest/v1/rpc/qbox_close_shipment_versioned', {
                        selected_port: port, selected_shipment: shipment.id, expected_version: detail.version, close_date: date.value
                    }, true);
                    if (shipmentEdit?.id === shipment.id) { shipmentEdit = null; $('shipment-edit-form').hidden = true; }
                    await Promise.all([refreshShipments(), refreshPlannings()]);
                    message('Expédition clôturée : planning mis à jour.');
                } catch (error) {
                    message(`${error.message} Actualisez les expéditions pour vérifier le résultat.`, true);
                } finally { shipmentSaving = false; close.disabled = false; }
            });
            card.append(label, close);
        }
        container.append(card);
    }
}

function updateShipmentEditNeeds() {
    if (!shipmentEdit) return;
    const plan = plans.find(item => item.id === shipmentEdit.planning_id);
    const draft = new Map();
    for (const row of $('shipment-edit-items').querySelectorAll('.shipment-item')) {
        const lot = stockLots.find(item => item.id === row.querySelector('[name=stock]').value);
        const quantity = Number(row.querySelector('[name=quantity]').value);
        if (lot && Number.isSafeInteger(quantity) && quantity > 0) draft.set(lot.product_id, (draft.get(lot.product_id) || 0) + quantity);
    }
    const needs = $('shipment-edit-needs');
    needs.replaceChildren();
    for (const item of (plan?.items || []).filter(item => item.csb_id === shipmentEdit.csb_id)) {
        const own = shipmentEdit.items.reduce((sum, line) => {
            const lot = stockLots.find(stock => stock.id === line.stock_id);
            return sum + (lot?.product_id === item.product_id ? line.quantity : 0);
        }, 0);
        const remaining = item.remaining + own - (draft.get(item.product_id) || 0);
        const line = document.createElement('p');
        line.textContent = `${item.product_name} · Besoin restant après cette expédition : ${remaining}`;
        needs.append(line);
    }
}

function addShipmentEditItem(existing = null) {
    if (!shipmentEdit) return;
    const row = document.createElement('div');
    row.className = 'shipment-item user';
    const label = document.createElement('label');
    label.textContent = 'Intrant et lot';
    const select = document.createElement('select');
    select.name = 'stock'; select.required = true;
    const plan = plans.find(item => item.id === shipmentEdit.planning_id);
    const allowed = new Set((plan?.items || []).filter(item => item.csb_id === shipmentEdit.csb_id).map(item => item.product_id));
    for (const lot of stockLots.filter(item => allowed.has(item.product_id))) {
        const own = shipmentEdit.items.find(item => item.stock_id === lot.id)?.quantity || 0;
        if (lot.available + own > 0) select.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible pour cette expédition : ${lot.available + own}`, lot.id));
    }
    if (!select.options.length) select.add(new Option('Aucun lot disponible', ''));
    if (existing) select.value = existing.stock_id;
    label.append(select);
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantité';
    const quantity = document.createElement('input');
    quantity.name = 'quantity'; quantity.type = 'number'; quantity.min = '1';
    quantity.max = '9007199254740991'; quantity.step = '1'; quantity.required = true;
    if (existing) quantity.value = existing.quantity;
    quantityLabel.append(quantity);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = 'Retirer cet intrant';
    remove.addEventListener('click', () => { row.remove(); updateShipmentEditNeeds(); });
    select.addEventListener('change', updateShipmentEditNeeds);
    quantity.addEventListener('input', updateShipmentEditNeeds);
    row.append(label, quantityLabel, remove);
    $('shipment-edit-items').append(row);
    updateShipmentEditNeeds();
}

async function openShipmentEdit(port, id) {
    if (shipmentSaving || !allowReferenceWrite('shipment')) return;
    if (shipmentEdit && !confirm('Abandonner la modification d’expédition en cours ?')) return;
    const sequence = ++shipmentEditRequest;
    const [detail] = await Promise.all([
        request('/rest/v1/rpc/qbox_shipment_details', { selected_port: port, selected_shipment: id }, true),
        refreshStock(), refreshPlannings()
    ]);
    if (sequence !== shipmentEditRequest || port !== $('reference-port').value || !token) return;
    if (detail.status !== 'En cours') throw new Error('Cette expédition n’est plus modifiable : actualisez la liste.');
    shipmentEdit = { ...detail, port };
    $('shipment-edit-title').textContent = `Modifier l’expédition ${detail.reference}`;
    $('shipment-edit-form').elements.transport.value = detail.transport;
    $('shipment-edit-items').replaceChildren();
    for (const item of detail.items) addShipmentEditItem(item);
    $('shipment-edit-form').hidden = false;
}

$('shipment-edit-add').addEventListener('click', () => addShipmentEditItem());
$('shipment-edit-cancel').addEventListener('click', () => {
    if (shipmentSaving) return;
    shipmentEditRequest++;
    shipmentEdit = null;
    $('shipment-edit-form').hidden = true;
});
$('shipment-edit-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (shipmentSaving || !shipmentEdit || !allowReferenceWrite('shipment')) return;
    const draft = shipmentEdit;
    const form = event.currentTarget;
    const items = [...$('shipment-edit-items').querySelectorAll('.shipment-item')].map(row => ({
        stock_id: row.querySelector('[name=stock]').value, quantity: Number(row.querySelector('[name=quantity]').value)
    }));
    if (!items.length || items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
        message('Ajoutez au moins un lot avec une quantité entière valide.', true); return;
    }
    const newTotals = new Map();
    for (const item of items) newTotals.set(item.stock_id, (newTotals.get(item.stock_id) || 0) + item.quantity);
    const returned = draft.items.map(item => ({ stock_id: item.stock_id, quantity: item.quantity - (newTotals.get(item.stock_id) || 0) })).filter(item => item.quantity > 0);
    const prompt = returned.length
        ? `Confirmez que ces produits sont physiquement revenus au port et conformes avant leur remise en stock :\n${describeFlightItems(returned)}`
        : `Enregistrer les modifications de l’expédition ${draft.reference} ?`;
    if (!confirm(prompt)) return;
    shipmentSaving = true;
    const controls = [...form.querySelectorAll('input, select, button'), $('reference-port')];
    controls.forEach(control => { control.disabled = true; });
    try {
        await request('/rest/v1/rpc/qbox_change_shipment', {
            selected_port: draft.port, selected_shipment: draft.id, expected_version: draft.version,
            action: 'edit', transport_name: form.elements.transport.value.trim(), items, return_confirmed: returned.length > 0
        }, true);
        if (shipmentEdit === draft) { shipmentEdit = null; form.hidden = true; }
        await Promise.all([refreshShipments(), refreshStock(), refreshPlannings()]);
        message('Expédition modifiée : stocks et besoins mis à jour.');
    } catch (error) { message(`${error.message} Actualisez les expéditions avant de recommencer si le résultat est incertain.`, true); }
    finally { shipmentSaving = false; controls.forEach(control => { control.disabled = false; }); }
});

function updateShipmentNeeds() {
    const form = $('shipment-form');
    const plan = plans.find(item => item.id === form.elements.planning.value);
    const draft = new Map();
    for (const row of $('shipment-items').querySelectorAll('.shipment-item')) {
        const lot = stockLots.find(item => item.id === row.querySelector('[name=stock]').value);
        const quantity = Number(row.querySelector('[name=quantity]').value);
        if (lot && Number.isSafeInteger(quantity) && quantity > 0) {
            draft.set(lot.product_id, (draft.get(lot.product_id) || 0) + quantity);
        }
    }
    const container = $('shipment-needs');
    container.replaceChildren();
    const needs = plan ? plan.items.filter(item => item.csb_id === form.elements.csb.value) : [];
    if (!needs.length) container.textContent = 'Aucun besoin pour ce CSB.';
    for (const item of needs) {
        const prepared = draft.get(item.product_id) || 0;
        const remaining = item.remaining - prepared;
        const line = document.createElement('p');
        line.textContent = `${item.product_name} · Prévu : ${item.planned} · Livré : ${item.delivered} · En vol : ${item.in_flight} · Transit terrestre : ${item.in_transit} · Cette expédition : ${prepared} · ${remaining < 0 ? `Dépassement : ${-remaining}` : `Restant : ${remaining}`}`;
        container.append(line);
    }
}

function addShipmentItem() {
    const row = document.createElement('div');
    row.className = 'user shipment-item';
    const label = document.createElement('label');
    label.textContent = 'Intrant et lot';
    const select = document.createElement('select');
    select.name = 'stock';
    select.required = true;
    const form = $('shipment-form');
    const plan = plans.find(item => item.id === form.elements.planning.value);
    const allowed = new Set((plan?.items || []).filter(item => item.csb_id === form.elements.csb.value).map(item => item.product_id));
    for (const lot of stockLots.filter(item => allowed.has(item.product_id) && item.available > 0)) {
        select.add(new Option(`${lot.name} · Lot ${lot.lot} · Disponible : ${lot.available}`, lot.id));
    }
    if (!select.options.length) select.add(new Option('Aucun lot disponible pour ce CSB', ''));
    label.append(select);
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Quantité';
    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.name = 'quantity';
    quantity.min = '1';
    quantity.max = '9007199254740991';
    quantity.step = '1';
    quantity.required = true;
    quantityLabel.append(quantity);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Retirer cet intrant';
    remove.addEventListener('click', () => { row.remove(); updateShipmentNeeds(); });
    row.append(label, quantityLabel, remove);
    $('shipment-items').append(row);
    select.addEventListener('change', updateShipmentNeeds);
    quantity.addEventListener('input', updateShipmentNeeds);
}

function updateShipmentCsbs() {
    const form = $('shipment-form');
    const plan = plans.find(item => item.id === form.elements.planning.value);
    form.elements.csb.replaceChildren();
    const byId = new Map((plan?.items || []).map(item => [item.csb_id, item.csb_name]));
    for (const [id, name] of byId) form.elements.csb.add(new Option(name, id));
    $('shipment-items').replaceChildren();
    addShipmentItem();
    updateShipmentNeeds();
}

$('shipment-new').addEventListener('click', async () => {
    if (!allowReferenceWrite('shipment') || shipmentSaving) return;
    const port = $('reference-port').value;
    try {
        await Promise.all([refreshStock(), refreshPlannings()]);
        if (!currentUser || port !== $('reference-port').value) return;
        const form = $('shipment-form');
        form.reset();
        form.elements.planning.replaceChildren();
        for (const plan of plans.filter(item => item.status === 'En cours')) {
            form.elements.planning.add(new Option(`${plan.code} · ${plan.start_date} au ${plan.end_date}`, plan.id));
        }
        if (!form.elements.planning.value) { message('Un planning actif est nécessaire.', true); return; }
        shipmentId = crypto.randomUUID();
        updateShipmentCsbs();
        form.hidden = false;
    } catch (error) { message(error.message, true); }
});
$('shipment-form').elements.planning.addEventListener('change', updateShipmentCsbs);
$('shipment-form').elements.csb.addEventListener('change', () => {
    $('shipment-items').replaceChildren();
    addShipmentItem();
    updateShipmentNeeds();
});
$('shipment-add').addEventListener('click', addShipmentItem);
$('shipment-cancel').addEventListener('click', () => { if (!shipmentSaving) $('shipment-form').hidden = true; });
$('shipment-refresh').addEventListener('click', () => Promise.all([refreshShipments(), refreshStock(), refreshPlannings()]).catch(error => message(error.message, true)));
$('shipment-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!allowReferenceWrite('shipment') || shipmentSaving || !shipmentId) return;
    const form = event.currentTarget;
    const items = [...$('shipment-items').querySelectorAll('.shipment-item')].map(row => ({
        stock_id: row.querySelector('[name=stock]').value,
        quantity: Number(row.querySelector('[name=quantity]').value)
    }));
    if (!form.elements.csb.value || !form.elements.transport.value.trim() || !items.length ||
        items.some(item => !item.stock_id || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
        message('Indiquez un CSB, un transport et au moins un lot avec une quantité valide.', true);
        return;
    }
    if (!confirm("Enregistrer l'expédition et déduire les quantités du stock ?")) return;
    shipmentSaving = true;
    const controls = [...form.querySelectorAll('input, select, button'), $('shipment-new'), $('reference-port')];
    controls.forEach(control => { control.disabled = true; });
    try {
        const reference = await request('/rest/v1/rpc/qbox_create_shipment', {
            request_id: shipmentId, selected_port: $('reference-port').value,
            selected_planning: form.elements.planning.value, selected_csb: form.elements.csb.value,
            transport_name: form.elements.transport.value.trim(), items
        }, true);
        form.hidden = true;
        await Promise.all([refreshShipments(), refreshStock(), refreshPlannings()]);
        message(`Expédition ${reference} enregistrée et stock déduit.`);
    } catch (error) {
        message(`${error.message} Actualisez les expéditions et les stocks avant une nouvelle saisie en cas de perte de connexion.`, true);
    } finally {
        shipmentSaving = false;
        controls.forEach(control => { control.disabled = false; });
    }
});

const configReady = fetch('local-config').then(async response => {
    if (!response.ok) throw new Error('Configuration Supabase locale indisponible.');
    config = await response.json();
});
if (embedded) {
    document.documentElement.classList.add('embedded');
    let embeddedInitialized = false;
    const sections = new Set(['references', 'dashboard-test', 'catalog', 'stock-test', 'stock-history-test',
        'quarantine-test', 'inventory-test', 'planning-test', 'flight-test', 'shipment-test', 'administration']);
    window.addEventListener('message', async event => {
        if (event.origin !== location.origin || event.source !== window.parent || !event.data) return;
        const data = event.data;
        if (data.type === 'qbox-embed-init' && !embeddedInitialized && typeof data.token === 'string') {
            embeddedInitialized = true;
            try {
                await configReady;
                sessionGeneration++;
                token = data.token;
                await initializeAccount(data.port);
                window.parent.postMessage({ type: 'qbox-embed-connected' }, location.origin);
            } catch (error) {
                clearSession();
                message(error.message, true);
                window.parent.postMessage({ type: 'qbox-embed-error', error: error.message }, location.origin);
            }
        } else if (data.type === 'qbox-session-updated' && embeddedInitialized && typeof data.token === 'string' && data.token) {
            token = data.token;
        } else if (data.type === 'qbox-embed-section' && sections.has(data.section)) {
            if (data.section === 'flight-test' && (!currentUser || currentUser.role !== 'admin')) {
                $('flight-test').classList.remove('embed-active');
                if (currentUser) {
                    message('Ce panneau est réservé aux administrateurs.', true);
                    window.parent.postMessage({ type: 'qbox-embed-error', error: 'Ce panneau est réservé aux administrateurs.' }, location.origin);
                }
                return;
            }
            document.documentElement.classList.toggle('embed-reference', data.section === 'references');
            document.documentElement.classList.toggle('embed-administration', data.section === 'administration');
            for (const id of sections) $(id).classList.toggle('embed-active', id === data.section);
            if (data.section === 'stock-history-test' && currentUser) {
                refreshStockHistory().catch(error => message(error.message, true));
            } else if (data.section === 'dashboard-test' && currentUser) {
                refreshDashboard();
            }
        } else if (data.type === 'qbox-set-port' && typeof data.port === 'string') {
            const select = $('reference-port');
            if (!select.disabled && [...select.options].some(option => option.value === data.port)) {
                select.value = data.port;
                select.dispatchEvent(new Event('change'));
            }
            notifyEmbeddedPort();
        } else if (data.type === 'qbox-data-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshStock(), refreshStockHistory(), refreshDashboard()])
                .catch(error => message(`Actualisation après réception impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-catalog-changed' && currentUser) {
            refreshProducts().catch(error => message(`Actualisation du catalogue impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-csb-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshCsbs(), refreshDashboard()])
                .catch(error => message(`Actualisation des CSB impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-ports-changed' && currentUser) {
            if (receiptSaving || planningSaving || flightSaving || shipmentSaving || quarantineSaving || inventorySaving ||
                inventoryDraft || flightEdit || shipmentEdit ||
                ['quarantine-form', 'receipt-form', 'planning-form', 'flight-form', 'shipment-form',
                    'reference-csb-form', 'reference-port-form'].some(id => !$(id).hidden)) {
                message('Les ports ont changé. Terminez ou annulez les saisies, puis actualisez les références.', true);
            } else {
                refreshReferences(data.port).catch(error => message(`Actualisation des ports impossible : ${error.message}`, true));
            }
        } else if (data.type === 'qbox-planning-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshPlannings(), refreshDashboard()])
                .catch(error => message(`Actualisation des plannings impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-flights-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshFlights(), refreshStock(), refreshPlannings(), refreshDashboard()])
                .catch(error => message(`Actualisation après les vols impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-shipments-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshShipments(), refreshStock(), refreshPlannings(), refreshDashboard()])
                .catch(error => message(`Actualisation après les expéditions impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-inventory-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshInventories(), refreshStock(), refreshDashboard()])
                .catch(error => message(`Actualisation après l’inventaire impossible : ${error.message}`, true));
        } else if (data.type === 'qbox-quarantine-changed' && currentUser && data.port === $('reference-port').value) {
            Promise.all([refreshQuarantines(), refreshStock(), refreshDashboard()])
                .catch(error => message(`Actualisation après la quarantaine impossible : ${error.message}`, true));
        }
    });
    configReady.then(() => window.parent.postMessage({ type: 'qbox-embed-ready' }, location.origin))
        .catch(error => {
            message(error.message, true);
            window.parent.postMessage({ type: 'qbox-embed-error', error: error.message }, location.origin);
        });
} else {
    configReady.catch(error => message(error.message, true));
}
