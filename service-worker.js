/**
 * Smart Agenda - Service Worker
 * Provides offline functionality and caching with proper update mechanism
 */

const CACHE_NAME = 'smart-agenda-v2.0.2';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/icon.png',
    '/core.js',
    '/i18n.js',
    '/data-management.js',
    '/ui-components.js',
    '/quick-actions.js',
    '/home.js',
    '/client-detail-view.js',
    '/clients.js',
    '/appointments.js',
    '/tasks.js',
    '/maps.js',
    '/calendar-views.js',
    '/settings.js'
];

// Install event - cache files and skip waiting
self.addEventListener('install', (event) => {
    console.log('[SW] Installing new service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating new service worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - Network first for app files, cache first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Network first strategy for HTML, JS, and CSS files
    if (url.pathname.endsWith('.html') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname === '/') {

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone the response before caching
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // If network fails, try cache
                    return caches.match(event.request);
                })
        );
    }
    // Cache first for images and other assets
    else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }

                    return fetch(event.request).then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    });
                })
        );
    }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
