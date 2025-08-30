const CACHE_NAME = 'behavana-cache-v1';
const URLS_TO_CACHE = [
  '/behavana-app/',
  '/behavana-app/index.html',
  '/manifest.json',
  '/behavana-app/logo.jpg',
  '/behavana-app/logo.jpg'
];

// Dingana 1: Fametrahana ny Service Worker (Installation)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Dingana 2: Fandraisana ny fangatahana (Fetch)
// Ity no manao izay handehanan'ny application "hors ligne"
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Raha misy ao anaty cache ilay izy, averina avy hatrany
        if (response) {
          return response;
        }
        // Raha tsy misy, dia alaina amin'ny internet
        return fetch(event.request);
      })
  );
});
// Dingana 3: Fampiasana (Activation) - Manadio cache taloha
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

