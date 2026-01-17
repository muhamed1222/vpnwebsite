/**
 * Service Worker для офлайн-режима
 * Кэширует статические ресурсы и обеспечивает работу приложения без интернета
 */

const STATIC_CACHE_NAME = 'outlivion-vpn-static-v1';
const DYNAMIC_CACHE_NAME = 'outlivion-vpn-dynamic-v1';

// Ресурсы для кэширования при установке
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

/**
 * Установка Service Worker
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        // Активируем новый Service Worker сразу
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Активация Service Worker
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Удаляем старые кэши
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     cacheName.startsWith('outlivion-vpn-');
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        // Берем контроль над всеми клиентами
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[Service Worker] Activation failed:', error);
      })
  );
});

/**
 * Обработка fetch запросов
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем не-GET запросы
  if (request.method !== 'GET') {
    return;
  }

  // Пропускаем chrome-extension и другие протоколы
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Стратегия кэширования в зависимости от типа запроса
  if (isStaticAsset(url)) {
    // Статические ресурсы: кэш-первый
    event.respondWith(cacheFirst(request));
  } else if (isApiRequest(url)) {
    // API запросы: сеть-первый с fallback на кэш
    event.respondWith(networkFirst(request));
  } else if (isPageRequest(url)) {
    // Страницы: сеть-первый с fallback на офлайн-страницу
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    // Остальное: сеть-первый
    event.respondWith(networkFirst(request));
  }
});

/**
 * Проверка, является ли запрос статическим ресурсом
 */
function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|woff|woff2|png|jpg|jpeg|gif|svg|ico|webp|avif)$/) ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/images/')
  );
}

/**
 * Проверка, является ли запрос API запросом
 */
function isApiRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('api.outlivion.space') ||
         url.hostname.includes('vpn.outlivion.space');
}

/**
 * Проверка, является ли запрос запросом страницы
 */
function isPageRequest(url) {
  return (
    url.pathname === '/' ||
    !url.pathname.includes('.') ||
    url.pathname.endsWith('/')
  );
}

/**
 * Стратегия кэш-первый: сначала проверяем кэш, затем сеть
 */
async function cacheFirst(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Стратегия сеть-первый: сначала сеть, затем кэш
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', error);
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Если нет в кэше, возвращаем ошибку
    return new Response(
      JSON.stringify({ error: 'Офлайн-режим. Данные недоступны.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Стратегия сеть-первый с fallback на офлайн-страницу
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', error);
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback на офлайн-страницу
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Если нет офлайн-страницы, возвращаем простую HTML страницу
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Офлайн - Outlivion VPN</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #000;
              color: #fff;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 400px;
            }
            h1 { font-size: 24px; margin-bottom: 16px; }
            p { font-size: 16px; opacity: 0.8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Нет подключения к интернету</h1>
            <p>Проверьте подключение к интернету и попробуйте снова.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

/**
 * Обработка сообщений от клиента
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
});
