'use strict';
// Service worker Q.box : met en cache l'interface (fichiers du site, Chart.js, polices)
// pour qu'elle s'affiche avec une connexion faible ou coupée.
// Il ne touche jamais aux appels Supabase (autre origine, données et authentification).
const CACHE = 'qbox-shell-v1';
const CDN_HOSTS = new Set(['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com']);

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const name of await caches.keys()) if (name.startsWith('qbox-') && name !== CACHE) await caches.delete(name);
        await self.clients.claim();
    })());
});

// Les fichiers versionnés (?v=...) et les CDN à version figée ne changent jamais pour une même adresse :
// ils sont servis depuis le cache puis rafraîchis. Le reste (pages, postgres-main.js, local-config…)
// passe d'abord par le réseau pour qu'une mise en ligne soit visible immédiatement.
function immutable(url) {
    return url.origin !== self.location.origin || url.searchParams.has('v');
}

async function store(request, response) {
    const url = new URL(request.url);
    // Les scripts et feuilles chargés depuis un CDN sans CORS donnent une réponse « opaque » (statut illisible) :
    // acceptée seulement pour les CDN, dont les adresses ont une version figée.
    if (response.type === 'opaque' ? url.origin === self.location.origin : !response.ok) return;
    const cache = await caches.open(CACHE);
    if (url.origin === self.location.origin && url.searchParams.has('v')) {
        // Supprime les anciennes versions du même fichier.
        for (const old of await cache.keys()) {
            const oldUrl = new URL(old.url);
            if (oldUrl.pathname === url.pathname && oldUrl.search !== url.search) await cache.delete(old);
        }
    }
    await cache.put(request, response);
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        await store(request, response.clone());
        return response;
    } catch (error) {
        const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
        if (cached) return cached;
        throw error;
    }
}

async function cacheFirst(request, event) {
    const cached = await caches.match(request);
    const update = fetch(request).then(async response => {
        await store(request, response.clone());
        return response;
    });
    if (cached) {
        event.waitUntil(update.catch(() => {}));
        return cached;
    }
    return update;
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || request.headers.has('Authorization')) return;
    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;
    if (!sameOrigin && !CDN_HOSTS.has(url.hostname)) return;
    event.respondWith(immutable(url) ? cacheFirst(request, event) : networkFirst(request));
});
