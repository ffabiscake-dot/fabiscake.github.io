// ============================================================
// products-loader.js
// Carga los productos desde Firestore en tiempo real
// y los deja en `window.PRODUCTS` con el MISMO formato que usa app.js:
//   { row, name, desc, price, unit, unit_label, img, icon, cat, estado, destacado }
//
// CARACTERÍSTICAS:
//   - Prioriza SIEMPRE Firestore sobre caché local
//   - Actualización en tiempo real cuando se editan productos en admin
//   - BroadcastChannel para sincronizar entre pestañas (con fallback a localStorage)
//   - Caché como fallback solo si Firestore falla
//   - Auto-refresco de la página cuando cambian los productos
//
// CÓMO SE USA en index.html:
//   <script type="module" src="js/products-loader.js"></script>
//   ANTES de <script src="js/app.js"></script>
// ============================================================
import { db, collection, query, orderBy, onSnapshot } from "./firebase-init.js";

const CACHE_KEY = "fabiscake_products_cache_v6";
const REFRESH_BROADCAST_KEY = "fabiscake_sync_refresh";
const BROADCAST_CHANNEL_NAME = "fabiscake_products_sync";

let hasInitializedFromFirestore = false;

let broadcastChannel = null;
try {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  console.log("✅ BroadcastChannel activado para sincronización entre pestañas");
} catch (e) {
  console.warn("⚠️ BroadcastChannel no soportado; usando fallback con localStorage");
}

function mapDoc(docSnap) {
  const d = docSnap.data();
  return {
    row: docSnap.id,
    name: d.nombre || "",
    desc: d.descripcion || "",
    price: Number(d.precio) || 0,
    unit: d.unidad || "unidad",
    unit_label: d.unidadEtiqueta || null,
    img: d.imagenPrincipal || "",
    icon: d.icono || "🎂",
    cat: d.categoria || "cakes",
    imagenes: Array.isArray(d.imagenes) ? d.imagenes : [],
    estado: d.estado || "Disponible",
    destacado: !!d.destacado,
    orden: typeof d.orden === "number" ? d.orden : 0
  };
}

function hashProducts(products) {
  if (!products || !Array.isArray(products)) return null;
  return JSON.stringify(products.map(p => ({ id: p.row, name: p.name, price: p.price, estado: p.estado })));
}

function productsChanged(oldProducts, newProducts) {
  if (!oldProducts || !newProducts) return true;
  if (oldProducts.length !== newProducts.length) return true;
  return hashProducts(oldProducts) !== hashProducts(newProducts);
}

function dispatchProducts(products, fromCache = false, source = "firestore") {
  const oldProducts = window.PRODUCTS;
  window.PRODUCTS = products;

  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache, source } }));

  if (!fromCache && hasInitializedFromFirestore && productsChanged(oldProducts, products)) {
    console.log(`✅ Productos actualizados desde ${source}. Refrescando catálogo...`);
    window.dispatchEvent(new CustomEvent("products:updated", { detail: { products } }));
  }
}

function hasFallback() {
  return Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;
}

function applyFirestoreProducts(products) {
  if (!products.length && hasFallback()) {
    console.warn("⚠️ Firestore no tiene productos. Se usa el catálogo de respaldo de data.js.");
    return;
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(products));
  dispatchProducts(products, false, "firestore");
  hasInitializedFromFirestore = true;
}

try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("fabiscake_products_cache_") && key !== CACHE_KEY) {
      localStorage.removeItem(key);
    }
  }
} catch (_) {}

const q = query(collection(db, "products"), orderBy("orden", "asc"), orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((docSnap) => products.push(mapDoc(docSnap)));
    applyFirestoreProducts(products);
  }, (error) => {
  console.error("❌ No se pudieron cargar los productos desde Firestore:", error);

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const products = JSON.parse(cached);
      console.warn("📦 Usando productos desde caché local (Firestore no disponible)");
      dispatchProducts(products, true, "cache");
    } catch (_) {
      console.error("❌ Error al parsear caché local");
    }
  } else if (!hasFallback()) {
    console.warn("⚠️ No hay productos disponibles. Verifica la conexión a Firestore.");
  }
});

if (broadcastChannel) {
  broadcastChannel.addEventListener("message", (event) => {
    const { type } = event.data || {};

    if (type === "PRODUCTS_REFRESH") {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const products = JSON.parse(cached);
          dispatchProducts(products, true, "broadcast");
        } catch (_) {}
      }
    }
  });
}

window.addEventListener("storage", (event) => {
  if (event.key !== REFRESH_BROADCAST_KEY) return;
  const payload = event.newValue ? JSON.parse(event.newValue) : null;
  if (!payload || !payload.ts) return;

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const products = JSON.parse(cached);
      dispatchProducts(products, true, "localStorage");
    } catch (_) {}
  }
});

window.fabiscakeBroadcastRefresh = function() {
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "PRODUCTS_REFRESH",
      ts: Date.now(),
      source: "admin"
    });
  }

  try {
    localStorage.setItem(REFRESH_BROADCAST_KEY, JSON.stringify({ ts: Date.now(), source: "admin" }));
  } catch (_) {}
};
