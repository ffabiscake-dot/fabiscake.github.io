// ============================================================
// products-loader.js
// Carga los productos desde Firestore en tiempo real
// y los deja en `window.PRODUCTS` con el MISMO formato que usa app.js:
//   { row, name, desc, price, unit, unit_label, img, icon, cat, estado, destacado }
//
// CARACTERÍSTICAS:
//   - Prioriza SIEMPRE Firestore sobre caché local
//   - Actualización en tiempo real cuando se editan productos en admin
//   - Caché como fallback solo si Firestore falla
//   - Auto-refresco de la página cuando cambian los productos
//
// CÓMO SE USA en index.html:
//   <script type="module" src="js/products-loader.js"></script>
//   ANTES de <script src="js/app.js"></script>
// ============================================================
import { db, collection, query, orderBy, onSnapshot } from "./firebase-init.js";

const CACHE_KEY = "fabiscake_products_cache_v6";
const REFRESH_BROADCAST_KEY = "fabiscake_sync_broadcast";
let hasInitializedFromFirestore = false;

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
      oldProd.desc !== newProd.desc ||
      oldProd.img !== newProd.img ||
      oldProd.estado !== newProd.estado ||
      oldProd.destacado !== newProd.destacado
    );
  });
}

function dispatchProducts(products, fromCache = false) {
  const oldProducts = window.PRODUCTS;
  window.PRODUCTS = products;

  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache } }));

  if (!fromCache && hasInitializedFromFirestore && productsChanged(oldProducts, products)) {
    console.log("✅ Productos actualizados desde Firestore. Refrescando catálogo...");
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
  dispatchProducts(products, false);
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
      dispatchProducts(products, true);
    } catch (_) {
      console.error("❌ Error al parsear caché local");
    }
  } else if (!hasFallback()) {
    console.warn("⚠️ No hay productos disponibles. Verifica la conexión a Firestore.");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== REFRESH_BROADCAST_KEY) return;
  const payload = event.newValue ? JSON.parse(event.newValue) : null;
  if (!payload || !payload.ts) return;

  console.log("🔄 Cambio detectado desde admin; recargando catálogo...");
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      dispatchProducts(JSON.parse(cached), true);
    } catch (_) {}
  }
});
