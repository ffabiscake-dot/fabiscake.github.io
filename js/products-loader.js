// ============================================================
// products-loader.js
// Carga los productos desde Firestore en tiempo real
// DEBE EJECUTARSE ANTES de app.js
// ============================================================
import { db, collection, query, orderBy, onSnapshot } from "./firebase-init.js";

const CACHE_KEY = "fabiscake_products_cache_v6";
const REFRESH_BROADCAST_KEY = "fabiscake_sync_refresh";
const BROADCAST_CHANNEL_NAME = "fabiscake_products_sync";

let hasInitializedFromFirestore = false;

// Intentar usar BroadcastChannel
let broadcastChannel = null;
try {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  console.log("✅ BroadcastChannel: sincronización entre pestañas activada");
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

function productsChanged(oldProducts, newProducts) {
  if (!oldProducts || !newProducts) return true;
  if (oldProducts.length !== newProducts.length) return true;

  return oldProducts.some((oldProd, idx) => {
    const newProd = newProducts[idx];
    if (!newProd) return true;
    return (
      oldProd.row !== newProd.row ||
      oldProd.name !== newProd.name ||
      oldProd.price !== newProd.price ||
      oldProd.img !== newProd.img ||
      oldProd.estado !== newProd.estado ||
      oldProd.destacado !== newProd.destacado
    );
  });
}

function dispatchProductsReady(products, fromCache = false, source = "firestore") {
  console.log(`📦 Productos cargados desde ${source} (${products.length} items). fromCache=${fromCache}`);
  
  window.PRODUCTS = products;

  // Evento principal que dispara el render de app.js
  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache, source } }));

  // Evento secundario para cambios detectados
  if (hasInitializedFromFirestore && !fromCache && productsChanged(window.PRODUCTS_PREVIOUS, products)) {
    console.log(`✅ Cambios detectados. Refrescando catálogo...`);
    window.dispatchEvent(new CustomEvent("products:updated", { detail: { products } }));
  }

  window.PRODUCTS_PREVIOUS = JSON.parse(JSON.stringify(products));
}

function hasFallback() {
  return Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;
}

function applyFirestoreProducts(products) {
  if (!products.length && hasFallback()) {
    console.warn("⚠️ Firestore vacío. Se mantiene catálogo local.");
    return;
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(products));
  dispatchProductsReady(products, false, "firestore");
  hasInitializedFromFirestore = true;
}

// Limpiar cachés viejos
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("fabiscake_products_cache_") && key !== CACHE_KEY) {
      localStorage.removeItem(key);
    }
  }
} catch (_) {}

// ============================================================
// LISTENER DE FIRESTORE EN TIEMPO REAL
// ============================================================
const q = query(collection(db, "products"), orderBy("orden", "asc"), orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((docSnap) => {
      products.push(mapDoc(docSnap));
    });
    applyFirestoreProducts(products);
  }, (error) => {
  console.error("❌ Error en Firestore:", error);

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const products = JSON.parse(cached);
      console.warn("📦 Usando caché local (Firestore no disponible)");
      dispatchProductsReady(products, true, "cache");
    } catch (_) {
      console.error("❌ Error al parsear caché");
    }
  } else if (!hasFallback()) {
    console.warn("⚠️ Sin productos disponibles");
  }
});

// ============================================================
// SINCRONIZACIÓN CROSS-TAB
// ============================================================
if (broadcastChannel) {
  broadcastChannel.addEventListener("message", (event) => {
    const { type } = event.data || {};
    if (type === "PRODUCTS_REFRESH") {
      console.log("🔄 Refresh desde otro tab (BroadcastChannel)");
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const products = JSON.parse(cached);
          dispatchProductsReady(products, true, "broadcast");
        } catch (_) {}
      }
    }
  });
}

window.addEventListener("storage", (event) => {
  if (event.key !== REFRESH_BROADCAST_KEY) return;
  console.log("🔄 Refresh desde otro tab (localStorage)");
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const products = JSON.parse(cached);
      dispatchProductsReady(products, true, "localStorage-event");
    } catch (_) {}
  }
});

// ============================================================
// FUNCIÓN PÚBLICA PARA DISPARAR REFRESH DESDE ADMIN
// ============================================================
window.fabiscakeBroadcastRefresh = function() {
  console.log("📢 Admin: Broadcast refresh a otros tabs");
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "PRODUCTS_REFRESH",
      ts: Date.now(),
      source: "admin"
    });
  }
  try {
    localStorage.setItem(REFRESH_BROADCAST_KEY, JSON.stringify({ ts: Date.now() }));
  } catch (_) {}
};

// Guardar primera copia para detectar cambios después
window.PRODUCTS_PREVIOUS = null;
