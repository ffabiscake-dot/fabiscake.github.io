// ============================================================
// service-worker.js
// Cachea los archivos estáticos del sitio para que cargue rápido
// y funcione (parcialmente) sin conexión. Los productos siempre
// se leen de Firestore/localStorage vía products-loader.js, así
// que el catálogo se sigue actualizando aunque este cache exista.
// ============================================================
const CACHE_NAME = "fabiscake-cache-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./js/firebase-init.js",
  "./js/products-loader.js",
  "./assets/logo.jpg",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Nunca cachear llamadas a Firebase/Firestore/Storage/Auth: siempre red.
  if (req.url.includes("firestore.googleapis.com") ||
      req.url.includes("firebasestorage.googleapis.com") ||
      req.url.includes("identitytoolkit.googleapis.com") ||
      req.url.includes("googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (req.method === "GET" && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
