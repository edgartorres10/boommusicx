/**
 * BoomMusicX - Service Worker
 * Gerencia cache e funcionalidades offline para PWA
 */

// Nome do cache - atualizar quando houver mudanças significativas
const CACHE_NAME = 'boommusicx-v1';

// Arquivos para cache inicial
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-brands-400.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2'
];

// Evento de instalação - cache dos arquivos estáticos
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Instalação completa');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Erro na instalação:', error);
            })
    );
});

// Evento de ativação - limpar caches antigos
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Ativação completa');
            return self.clients.claim();
        })
    );
});

// Evento de fetch - interceptar requisições
self.addEventListener('fetch', event => {
    // Ignorar requisições que não são HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    // Estratégia: Stale-while-revalidate para performance
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Retorna cache imediatamente se disponível
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        // Atualiza cache com nova resposta
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(error => {
                                    console.error('Service Worker: Erro ao atualizar cache:', error);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('Service Worker: Falha na rede, usando cache:', error);
                        
                        // Para requisições de página HTML, retorna página offline personalizada
                        if (event.request.headers.get('Accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        return cachedResponse;
                    });
                
                return cachedResponse || fetchPromise;
            })
    );
});

// Evento de mensagem - para comunicação com a página
self.addEventListener('message', event => {
    console.log('Service Worker: Mensagem recebida:', event.data);
    
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Evento de push - para notificações (futuro)
self.addEventListener('push', event => {
    console.log('Service Worker: Push recebido');
    
    const title = 'BoomMusicX';
    const options = {
        body: 'Nova música disponível!',
        icon: 'https://via.placeholder.com/192x192/1DB954/ffffff?text=BMX',
        badge: 'https://via.placeholder.com/72x72/1DB954/ffffff?text=BMX',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Evento de clique em notificação
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notificação clicada');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});