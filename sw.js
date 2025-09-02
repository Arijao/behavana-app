// sw.js

// 1. Ovay ny anaran'ny cache mba hanerena fanavaozana
const CACHE_NAME = 'behavana-cache-v1.1'; // <-- Version vaovao

// 2. Lisitry ny rakitra miaraka amin'ny lalana marina ho an'ny GitHub Pages
const URLS_TO_CACHE = [
  // --- FANITSIANA LEHIBE ETO ---
  // Ampiana '/behavana-app/' daholo ny rakitra eo an-toerana
  '/behavana-app/',
  '/behavana-app/index.html',
  '/behavana-app/manifest.json',
  '/behavana-app/logo.jpg',

  // Ireo script sy style avy any ivelany (CDN) dia tsy ovaina
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 3. Dingana "Install": Mitahiry ireo rakitra ao anaty cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME )
      .then(cache => {
        console.log('Cache nosokafana. Manomboka mitahiry rakitra...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(error => {
        console.error('Tsy nahomby ny fitehirizana rakitra tao anaty cache:', error);
      })
  );
});

// 4. Dingana "Activate": Mamafa ireo cache taloha
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Mamafa cache taloha:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 5. Dingana "Fetch": Manome ny valiny rehefa misy fangatahana
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Raha hita ao anaty cache ilay fangatahana, dia io no averina avy hatrany
        if (response) {
          return response;
        }
        // Raha tsy hita, dia andramana alaina any anaty internet
        return fetch(event.request);
      })
  );
});
