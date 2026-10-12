const CACHE_NAME = 'tavolo-esami-shell-v5';
const APP_SHELL = ['./', './index.html', './styles.css', './practice-section.css', './practice-exercises.js', './practice-visual-labs.js', './app.webmanifest', './app-icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tavolo-esami-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/11.10.0/')) {
    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') await cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/__/auth/handler')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(async () => {
      const cached = await caches.match('./index.html');
      if (cached) return cached;
      return new Response('<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>offline · tavolo esami</title><body style="font:16px system-ui;padding:2rem;line-height:1.5"><h1>sei offline</h1><p>La dashboard non è ancora stata salvata su questo dispositivo. Collegati una volta per renderla disponibile offline.</p></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }));
    return;
  }
  if (!['styles.css', 'practice-section.css', 'practice-exercises.js', 'practice-visual-labs.js', 'app.webmanifest', 'app-icon.svg'].some(file => url.pathname.endsWith(`/${file}`))) return;
  event.respondWith(caches.match(request).then(async cached => {
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }));
});
