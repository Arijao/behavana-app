const CACHE_NAME = 'behavana-cache-v1';
const URLS_TO_CACHE = [
  '/behavana-app/',
  '/behavana-app/index.html',
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
