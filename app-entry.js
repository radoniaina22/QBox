'use strict';
document.documentElement.classList.add('postgres-mode');
const entryScript = document.createElement('script');
entryScript.src = 'postgres-main.js?v=91aaeea4c4';
entryScript.async = false;
entryScript.onerror = () => {
    document.documentElement.classList.add('postgres-ready');
    document.getElementById('postgres-login-status').textContent = 'Impossible de charger le mode PostgreSQL. Actualisez la page.';
    document.getElementById('main-login').classList.add('postgres-hidden');
    document.getElementById('demo-profiles').classList.add('postgres-hidden');
};
document.body.append(entryScript);
