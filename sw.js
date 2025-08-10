const CACHE_NAME = 'shmmy-cache-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/signup.html',
  '/styles.css',
  '/script.js',
  '/past_papers.html',
  '/past_papers.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', evt => {
  evt.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', evt => {
  const { request } = evt;
  if (request.method !== 'GET') return;
  // Network first for API, cache first for static
  if (request.url.includes('/api/past-papers')) {
    evt.respondWith(
      fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      }).catch(() => caches.match(request))
    );
  } else {
    evt.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      }).catch(() => caches.match('/index.html')))
    );
  }
});
