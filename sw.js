// Service worker: guarda la app y sus librerías para que abra sin internet.
const CACHE = 'vimed-taller-v1';
const LOCAL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(LOCAL);
    // Las librerías externas se guardan como respuestas "opacas" (no-cors).
    await Promise.all(CDN.map(async u => { try { await c.put(u, await fetch(u, { mode: 'no-cors' })); } catch (_) {} }));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;               // primero lo guardado (funciona offline)
    try {
      const res = await fetch(e.request);
      if (res && (res.ok || res.type === 'opaque')) (await caches.open(CACHE)).put(e.request, res.clone());
      return res;
    } catch (_) {
      return e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
    }
  })());
});
