const CACHE_NAME = 'behavana-cache-v1';
// Lisitry ny rakitra fototra ilain'ny application mba handeha
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  // Ampidirina eto izay rakitra CSS na JS hafa ampiasainao
  // Ohatra: '/style.css', '/autre-script.js'
  '/logo192.png',
  '/logo512.png'
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
