// ============================================================
// products-loader.js
// Carga los productos desde Firestore en tiempo real.
// Se ejecuta ANTES de que app.js pinte el catálogo (app.js espera
// el evento "products:ready").
//
// Cambios clave frente a la versión anterior:
//  - La consulta YA NO usa orderBy("orden") + orderBy("createdAt"):
//    Firestore descarta los documentos que no tienen esos campos
//    (p. ej. los creados por la migración antigua), y además esa
//    consulta exige un índice compuesto. Ahora se leen TODOS los
//    documentos y se ordenan aquí.
//  - Los productos con estado "Oculto" no se publican.
//  - Un fallo al guardar la caché (localStorage lleno) ya no impide
//    pintar el catálogo.
// ============================================================
import { db, collection, onSnapshot } from "./firebase-init.js";
import { isHiddenProduct, sortProducts } from "./products-model.js";

const CACHE_KEY = "fabiscake_products_cache_v7"; // app.js usa la misma clave
const REFRESH_BROADCAST_KEY = "fabiscake_sync_refresh";
const BROADCAST_CHANNEL_NAME = "fabiscake_products_sync";

let broadcastChannel = null;
try {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
} catch (e) {
  console.warn("BroadcastChannel no soportado; se usa localStorage como respaldo");
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
    orden: typeof d.orden === "number" ? d.orden : null,
    _created: d.createdAt && typeof d.createdAt.seconds === "number" ? d.createdAt.seconds : null,
    _hidden: isHiddenProduct(d)
  };
}

function dispatchProductsReady(products, fromCache, source) {
  console.log(`Productos cargados desde ${source} (${products.length}).`);
  window.PRODUCTS = products;
  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache, source } }));
}

function hasFallback() {
  return Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;
}

// La caché es opcional: si no cabe en localStorage (las fotos van
// incrustadas en base64) se guarda sin fotos, y si tampoco cabe, se omite.
function saveCache(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products));
    return;
  } catch (_) {}
  try {
    const slim = products.map((p) => ({ ...p, img: /^data:/.test(p.img) ? "" : p.img, imagenes: [] }));
    localStorage.setItem(CACHE_KEY, JSON.stringify(slim));
  } catch (_) {
    console.warn("No se pudo guardar la caché local (almacenamiento lleno).");
  }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const list = raw ? JSON.parse(raw) : null;
    return Array.isArray(list) && list.length ? list : null;
  } catch (_) {
    return null;
  }
}

try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("fabiscake_products_cache_") && key !== CACHE_KEY) {
      localStorage.removeItem(key);
    }
  }
} catch (_) {}

// ============================================================
// LISTENER DE FIRESTORE EN TIEMPO REAL (todos los documentos)
// ============================================================
onSnapshot(
  collection(db, "products"),
  (snapshot) => {
    const all = [];
    snapshot.forEach((docSnap) => all.push(mapDoc(docSnap)));

    // Colección realmente vacía: se usa el respaldo (data.js) y se avisa.
    if (all.length === 0) {
      console.warn("Firestore no tiene productos. Se muestra el catálogo de respaldo (data.js).");
      if (hasFallback()) {
        dispatchProductsReady(window.PRODUCTS, true, "fallback");
        return;
      }
    }

    const products = sortProducts(all.filter((p) => !p._hidden));
    saveCache(products);
    dispatchProductsReady(products, false, "firestore");
  },
  (error) => {
    console.error("Error leyendo Firestore:", error && error.code, error && error.message);
    const cached = readCache();
    if (cached) {
      dispatchProductsReady(cached, true, "cache");
    } else if (hasFallback()) {
      dispatchProductsReady(window.PRODUCTS, true, "fallback");
    } else {
      window.dispatchEvent(new CustomEvent("products:error", { detail: { error: error && (error.code || error.message) } }));
    }
  }
);

// ============================================================
// SINCRONIZACIÓN ENTRE PESTAÑAS (se conserva)
// ============================================================
function reloadFromCache(source) {
  const cached = readCache();
  if (cached) dispatchProductsReady(cached, true, source);
}

if (broadcastChannel) {
  broadcastChannel.addEventListener("message", (event) => {
    if ((event.data || {}).type === "PRODUCTS_REFRESH") reloadFromCache("broadcast");
  });
}

window.addEventListener("storage", (event) => {
  if (event.key === REFRESH_BROADCAST_KEY) reloadFromCache("localStorage-event");
});

window.fabiscakeBroadcastRefresh = function () {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "PRODUCTS_REFRESH", ts: Date.now(), source: "admin" });
  }
  try {
    localStorage.setItem(REFRESH_BROADCAST_KEY, JSON.stringify({ ts: Date.now() }));
  } catch (_) {}
};
