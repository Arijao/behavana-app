// sw.js - Service Worker BEHAVANA
// Version vaovao: v2.2 - Offline First + Local Fonts + Bug fixes

const CACHE_NAME = 'behavana-cache-v2.2';
const URLS_TO_CACHE = [
    // App principale
    '/behavana-app/',
    '/behavana-app/index.html',
    '/behavana-app/manifest.json',
    '/behavana-app/logo.jpg',

    // Polices locales — CSS
    '/behavana-app/fonts/icon.css',
    '/behavana-app/fonts/fa/all.min.css',

    // Polices locales — Roboto
    '/behavana-app/fonts/roboto-v51-latin-regular.woff2',
    '/behavana-app/fonts/roboto-condensed-v31-latin-300.woff2',
    '/behavana-app/fonts/roboto-condensed-v31-latin-300italic.woff2',
    '/behavana-app/fonts/roboto-condensed-v31-latin-700.woff2',
    '/behavana-app/fonts/roboto-condensed-v31-latin-700italic.woff2',

    // Polices locales — Material Icons
    '/behavana-app/fonts/material-icons-v145-latin-regular.woff2',
    '/behavana-app/fonts/material-icons-outlined-v110-latin-regular.woff2',
    '/behavana-app/fonts/material-symbols-outlined-v325-latin-regular.woff2',

    // Polices locales — Font Awesome
    '/behavana-app/fonts/fa/webfonts/fa-solid-900.woff2',
    '/behavana-app/fonts/fa/webfonts/fa-regular-400.woff2',
    '/behavana-app/fonts/fa/webfonts/fa-brands-400.woff2',

    // Libs JS (CDN)
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
                return self.skipWaiting();
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
                return self.clients.claim();
            })
    );
});

// ========================================
// 3. FETCH - Stratégie: Cache First, fallback Network
// ========================================
self.addEventListener('fetch', event => {
    const { request } = event;
    
    if (request.url.includes('chrome-extension://')) {
        return;
    }
    
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] 💾 Avy cache:', request.url.substring(0, 50) + '...');
                    
                    if (isCDNResource(request.url)) {
                        return cachedResponse;
                    }
                    
                    fetchAndUpdate(request);
                    return cachedResponse;
                }
                
                console.log('[SW] 🌐 Avy network:', request.url.substring(0, 50) + '...');
                return fetch(request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }
                        
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

function isCDNResource(url) {
    return url.includes('cdnjs.cloudflare.com') ||
           url.includes('cdn.jsdelivr.net');
}

function fetchAndUpdate(request) {
    fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, response.clone()));
            }
        })
        .catch(() => {});
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
        console.log('[SW] Mamoaka data...');
        // event.waitUntil() eto no hampiana sync logic raha ilaina
    }
});

console.log('[SW] 🚀 Service Worker script loaded!');