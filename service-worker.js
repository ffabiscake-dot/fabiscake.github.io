// ============================================================
// service-worker.js — Fabi's Cake PWA v2
// Estrategias:
//   - Cache-first para assets estáticos (CSS, JS, imágenes)
//   - Stale-while-revalidate para páginas HTML
//   - Network-first para Firebase/API
//   - Página offline de fallback
// ============================================================

const CACHE_VERSION = "v2";
const CACHE_STATIC = `fabiscake-static-${CACHE_VERSION}`;
const CACHE_PAGES  = `fabiscake-pages-${CACHE_VERSION}`;
const CACHE_IMAGES = `fabiscake-images-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/site.js",
  "./js/data.js",
  "./js/firebase-config.js",
  "./js/firebase-init.js",
  "./js/products-loader.js",
  "./assets/logo.jpg",
  "./assets/icon-fallback.svg",
  "./manifest.json",
  "./offline.html"
];

const NEVER_CACHE = [
  "firestore.googleapis.com",
  "firebasestorage.googleapis.com",
  "identitytoolkit.googleapis.com",
  "googleapis.com/recaptcha",
  "facebook.net",
  "doubleclick.net",
  "googletagmanager.com"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const validCaches = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !validCaches.includes(k)).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (NEVER_CACHE.some(domain => url.hostname.includes(domain))) return;
  if (req.method !== "GET") return;

  if (req.destination === "image" || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(cacheFirstWithFallback(req, CACHE_IMAGES));
    return;
  }

  if (req.destination === "document" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(staleWhileRevalidate(req, CACHE_PAGES));
    return;
  }

  if (req.destination === "style" || req.destination === "script" || req.destination === "font" ||
      url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/i)) {
    event.respondWith(cacheFirstWithFallback(req, CACHE_STATIC));
    return;
  }

  event.respondWith(staleWhileRevalidate(req, CACHE_STATIC));
});

async function cacheFirstWithFallback(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (request.destination === "image") {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect fill="#ffe4f2" width="200" height="200"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#d6478e" font-size="14" font-family="sans-serif">Fabi's Cake</text>
        </svg>`,
        { headers: { "Content-Type": "image/svg+xml" } }
      );
    }
    const offlineResponse = await caches.match("./offline.html");
    return offlineResponse || new Response("Sin conexión", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || "Nuevo mensaje de Fabi's Cake",
    icon: "./assets/logo.jpg",
    badge: "./assets/logo.jpg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "./" },
    actions: [
      { action: "open", title: "Ver" },
      { action: "close", title: "Cerrar" }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Fabi's Cake", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
