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
let hasInitializedFromFirestore = false;

function mapDoc(docSnap) {
  const d = docSnap.data();
  return {
    row: docSnap.id,                              // identificador único (string)
    name: d.nombre || "",
    desc: d.descripcion || "",
    price: Number(d.precio) || 0,
    unit: d.unidad || "unidad",                    // "unidad" | "cotizar" | otro
    unit_label: d.unidadEtiqueta || null,
    img: d.imagenPrincipal || "",
    icon: d.icono || "🎂",
    cat: d.categoria || "cakes",                    // debe ser un id válido de CATEGORIES
    imagenes: Array.isArray(d.imagenes) ? d.imagenes : [],
    estado: d.estado || "Disponible",               // "Disponible" | "Agotado"
    destacado: !!d.destacado,
    orden: typeof d.orden === "number" ? d.orden : 0
  };
}

function productsChanged(oldProducts, newProducts) {
  if (!oldProducts || !newProducts) return true;
  if (oldProducts.length !== newProducts.length) return true;
  
  // Comparar rápido: si algún producto cambió, es cambio
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
  
  // Emitir evento para que app.js sepa que hay productos nuevos
  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache } }));
  
  // Si es la primera vez desde Firestore Y hay cambios reales, recargar el catálogo
  if (!fromCache && hasInitializedFromFirestore && productsChanged(oldProducts, products)) {
    console.log("✅ Productos actualizados desde Firestore. Refrescando catálogo...");
    window.dispatchEvent(new CustomEvent("products:updated", { detail: { products } }));
  }
}

// Si Firestore viene VACÍA (aún no migras tus productos o borraste todo),
// conservamos el catálogo de respaldo de js/data.js para que la página
// nunca se quede sin productos a la vista.
function hasFallback() {
  return Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;
}

function applyFirestoreProducts(products) {
  if (!products.length && hasFallback()) {
    console.warn("⚠️ Firestore no tiene productos. Se usa el catálogo de respaldo de data.js.");
    return;
  }
  
  // Guardar en caché como respaldo
  localStorage.setItem(CACHE_KEY, JSON.stringify(products));
  dispatchProducts(products, false);
  hasInitializedFromFirestore = true;
}

// Limpiar cachés viejos de versiones anteriores
try {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("fabiscake_products_cache_") && key !== CACHE_KEY) {
      localStorage.removeItem(key);
    }
  }
} catch (_) {}

// CONFIGURAR LISTENER EN TIEMPO REAL A FIRESTORE
// Esto se ejecuta INMEDIATAMENTE cuando la página carga
// y se actualiza automáticamente cada vez que se edita un producto en admin
const q = query(collection(db, "products"), orderBy("orden", "asc"), orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((docSnap) => products.push(mapDoc(docSnap)));
    
    // Aplicar productos desde Firestore (siempre prioriza Firestore)
    applyFirestoreProducts(products);
  }, (error) => {
  console.error("❌ No se pudieron cargar los productos desde Firestore:", error);
  
  // Si Firestore falla, intentar cargar desde caché
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
