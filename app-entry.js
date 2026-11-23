'use strict';
document.documentElement.classList.add('postgres-mode');
const entryScript = document.createElement('script');
entryScript.src = 'postgres-main.js?v=ecfa169b1a';
entryScript.async = false;
entryScript.onerror = () => {
    document.documentElement.classList.add('postgres-ready');
    document.getElementById('postgres-login-status').textContent = 'Impossible de charger le mode PostgreSQL. Actualisez la page.';
    document.getElementById('main-login').classList.add('postgres-hidden');
};
document.body.append(entryScript);
