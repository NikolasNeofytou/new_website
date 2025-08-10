const CACHE_VERSION = 'v5'; // bump when static assets change (removed chatbot & forum links)
const CACHE_NAME = 'shmmy-cache-' + CACHE_VERSION;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/signup.html',
  '/announcements.html',
  '/past_papers.html',
  '/past_paper_view.html',
  '/profile.html',
  '/icons_preview.html',
  '/styles.css',
  '/script.js',
  '/past_papers.js',
  '/past_paper_view.js',
  '/profile.js',
  '/signup.js',
  '/auth_client.js',
  '/icons/sprite.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(async c => {
      await c.addAll(CORE_ASSETS.map(u => u + '?v=' + CACHE_VERSION));
    }).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('shmmy-cache-') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  const { request } = evt;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Bypass caching for auth endpoints and meta JSON
  if (/\/auth\//.test(url.pathname) || url.pathname.endsWith('past_papers_meta.json')) {
    return; // let network handle
  }
  // Network first for API data
  if (url.pathname.startsWith('/api/')) {
    evt.respondWith(
      fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }
  // For core navigational requests ensure we try updated version (cache-bust query stored key)
  if (request.mode === 'navigate' || ['text/html'].includes(request.headers.get('accept')||'')) {
    evt.respondWith(
      fetch(request).then(res => {
        const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(request, clone)); return res;
      }).catch(()=> caches.match(request).then(cached=> cached || caches.match('/index.html?v='+CACHE_VERSION)))
    );
    return;
  }
  // Static asset: cache-first with version fallback
  evt.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(request, clone)); return res;
    }))
  );
});

// Optional: message listener to trigger skipWaiting from client when updating
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION') {
    // Respond with current cache/app version
    e.source && e.source.postMessage && e.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  }
});
