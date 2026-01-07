// sw.js - Service Worker BEHAVANA
// Version vaovao: v2.0 - Offline First Strategy

const CACHE_NAME = 'behavana-cache-v2.0';
const URLS_TO_CACHE = [
    // Rakitra eo an-toerana (GitHub Pages)
    '/behavana-app/',
    '/behavana-app/index.html',
    '/behavana-app/manifest.json',
    '/behavana-app/logo.jpg',
    
    // CDN resources
    'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// ========================================
// 1. INSTALL - Mitahiry rakitra ao cache
// ========================================
self.addEventListener('install', event => {
    console.log('[SW] 📦 Installation Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] ✅ Cache nosokafana:', CACHE_NAME);
                console.log('[SW] 📥 Manomboka mitahiry', URLS_TO_CACHE.length, 'rakitra...');
                
                // Mitahiry ny rakitra iray iray mba tsy hijanona rehefa misy error
                return Promise.allSettled(
                    URLS_TO_CACHE.map(url => {
                        return cache.add(url)
                            .then(() => console.log('[SW] ✓ Cached:', url))
                            .catch(error => console.warn('[SW] ✗ Tsy nahomby:', url, error));
                    })
                );
            })
            .then(() => {
                console.log('[SW] 🎉 Installation vita!');
                return self.skipWaiting(); // Activation avy hatrany
            })
            .catch(error => {
                console.error('[SW] ❌ Tsy nahomby ny installation:', error);
            })
    );
});

// ========================================
// 2. ACTIVATE - Mamafa cache taloha
// ========================================
self.addEventListener('activate', event => {
    console.log('[SW] 🔄 Activation Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] 🗑️ Mamafa cache taloha:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] ✅ Activation vita!');
                return self.clients.claim(); // Mahazo contrôle avy hatrany
            })
    );
});

// ========================================
// 3. FETCH - Stratégie: Cache First, fallback Network
// ========================================
self.addEventListener('fetch', event => {
    const { request } = event;
    
    // Tsy miraharaha amin'ny chrome extensions
    if (request.url.includes('chrome-extension://')) {
        return;
    }
    
    // Seulement GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        // Mitady amin'ny cache aloha
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] 💾 Avy cache:', request.url.substring(0, 50) + '...');
                    
                    // Raha CDN resources, averina avy cache
                    if (isCDNResource(request.url)) {
                        return cachedResponse;
                    }
                    
                    // Raha app resources, maka vaovao any network nefa averina ny cache aloha
                    fetchAndUpdate(request);
                    return cachedResponse;
                }
                
                // Tsy ao cache, maka any network
                console.log('[SW] 🌐 Avy network:', request.url.substring(0, 50) + '...');
                return fetch(request)
                    .then(response => {
                        // Tsy cache raha tsy 200 OK
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        
                        // Clone response satria utilisable once
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseToCache);
                                console.log('[SW] 💾 Novaovaozina cache:', request.url.substring(0, 50) + '...');
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.warn('[SW] ⚠️ Network failed:', error);
                        
                        // Raha HTML request dia manome index.html
                        if (request.destination === 'document') {
                            return caches.match('/behavana-app/index.html');
                        }
                        
                        return new Response('Offline - Tsy afaka mahazo ny resource', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// ========================================
// HELPER FUNCTIONS
// ========================================

// Mamaritra raha CDN resource
function isCDNResource(url) {
    return url.includes('googleapis.com') ||
           url.includes('cdnjs.cloudflare.com') ||
           url.includes('cdn.jsdelivr.net');
}

// Maka vaovao any network background
function fetchAndUpdate(request) {
    fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, response.clone()));
            }
        })
        .catch(() => {
            // Tsy maninona raha tsy afaka
        });
}

// ========================================
// 4. MESSAGE - Communication amin'ny app
// ========================================
self.addEventListener('message', event => {
    console.log('[SW] 💬 Message reko:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }).then(() => {
                console.log('[SW] 🗑️ Cache rehetra voafafa!');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// ========================================
// 5. SYNC - Background sync (future)
// ========================================
self.addEventListener('sync', event => {
    console.log('[SW] 🔄 Background sync:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(
            console.log('[SW] Mamoaka data...')
            // Eto no hampiana sync logic raha ilaina
        );
    }
});

console.log('[SW] 🚀 Service Worker script loaded!');
