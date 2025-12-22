// Chef.ai Service Worker
const CACHE_NAME = 'chef-ai-static-v3';
const PRE_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CORREÇÃO: Ignorar ABSOLUTAMENTE tudo que for do ambiente de dev
  // Isso resolve os erros de "FetchEvent resulted in a network error response"
  if (
    url.hostname === 'localhost' || 
    url.port === '3000' ||
    url.pathname.includes('@vite') || 
    url.pathname.includes('@react-refresh') ||
    url.pathname.includes('chrome-extension') ||
    url.pathname.includes('hot-update') ||
    url.pathname.includes('manifest.json') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback básico se a rede falhar
        return new Response('Rede indisponível', { status: 503 });
      });
    })
  );
});