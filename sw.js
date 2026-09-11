// Service worker de VBC Minutajes.
// Cachea el "cascarón" de la app (HTML, manifest, iconos) para que abra rápido
// y funcione como app instalada. Los datos (Supabase) NUNCA se cachean aquí:
// las peticiones a otros orígenes se dejan pasar directas a la red siempre.

const CACHE_NAME = 'vbc-app-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Nunca interceptar peticiones a Supabase ni a ningún otro origen
  // (así los datos y el tiempo real siempre van directos a la red).
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  // Red primero, con la copia en caché como respaldo si no hay conexión.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
