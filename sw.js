self.addEventListener('install', (e) => {
    console.log('Service Worker instalado');
});

self.addEventListener('activate', (e) => {
    console.log('Service Worker ativado');
});

self.addEventListener('fetch', (event) => {
    // Opcional: interceptar requests para cache
    event.respondWith(fetch(event.request));
});