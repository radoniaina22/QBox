'use strict';
const postgresMode = document.documentElement.classList.contains('postgres-mode') ||
    new URLSearchParams(location.search).get('backend') === 'postgres';
if (postgresMode) document.documentElement.classList.add('postgres-mode');
const entryScript = document.createElement('script');
entryScript.src = postgresMode ? 'postgres-main.js' : 'app.js';
entryScript.async = false;
entryScript.onerror = () => {
    if (postgresMode) {
        document.documentElement.classList.add('postgres-ready');
        document.getElementById('postgres-login-status').textContent = 'Impossible de charger le mode PostgreSQL. Actualisez la page.';
        document.getElementById('main-login').classList.add('postgres-hidden');
        document.getElementById('demo-profiles').classList.add('postgres-hidden');
    }
};
document.body.append(entryScript);
