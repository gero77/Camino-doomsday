// Camino a Doomsday — service worker
// Subí el número de VERSION cada vez que reemplaces los archivos: fuerza la actualización.
const VERSION = "v3";
const CACHE = "doomsday-" + VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192-b.png",
  "./icon-512-b.png",
  "./icon-maskable-b.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Las tipografías de Google: red primero, caché como respaldo.
  if (url.origin !== location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // La app: caché primero, y de fondo busca una versión nueva.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => hit || caches.match("./index.html"));
      return hit || net;
    })
  );
});
