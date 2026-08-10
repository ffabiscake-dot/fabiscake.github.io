// ============================================================
// products-loader.js
// Carga los productos desde Firestore y los deja en `window.PRODUCTS`
// con el MISMO formato que ya usa tu app.js:
//   { row, name, desc, price, unit, unit_label, img, icon, cat, estado, destacado }
//
// CÓMO SE USA en index.html:
//   <script type="module" src="js/products-loader.js"></script>
//   ANTES de <script src="js/app.js"></script>
// ============================================================
import { db, collection, query, orderBy, onSnapshot } from "./firebase-init.js";

const CACHE_KEY = "fabiscake_products_cache_v3";

function mapDoc(docSnap) {
  const d = docSnap.data();
  return {
    row: docSnap.id,                              // identificador único (string)
    name: d.nombre || "",
    desc: d.descripcion || "",
    price: Number(d.precio) || 0,
    unit: d.unidad || "unidad",                    // "unidad" | "cotizar" | otro
    unit_label: d.unidadEtiqueta || "",
    img: d.imagenPrincipal || "",
    icon: d.icono || "🎂",
    cat: d.categoria || "cakes",                    // debe ser un id válido de CATEGORIES
    imagenes: Array.isArray(d.imagenes) ? d.imagenes : [],
    estado: d.estado || "Disponible",               // "Disponible" | "Agotado"
    destacado: !!d.destacado,
    orden: typeof d.orden === "number" ? d.orden : 0
  };
}

function dispatchProducts(products, fromCache) {
  window.PRODUCTS = products;
  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache } }));
}

// Si Firestore viene VACÍA (aún no migras tus productos o borraste todo),
// conservamos el catálogo de respaldo de js/data.js para que la página
// nunca se quede sin productos a la vista.
function hasFallback() {
  return Array.isArray(window.PRODUCTS) && window.PRODUCTS.length > 0;
}

function applyFirestoreProducts(products) {
  if (!products.length && hasFallback()) {
    console.warn("Firestore no tiene productos (o no se migraron). Se muestra el catálogo de respaldo de data.js.");
    return;
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(products));
  dispatchProducts(products, false);
}

// Pinta de inmediato lo último guardado (carga rápida / offline).
const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
  try { dispatchProducts(JSON.parse(cached), true); } catch (_) {}
}

// Ordena primero por "orden" (número fijo de posición, que la migración y el
// admin asignan) y usa createdAt solo como desempate. Así, editar un producto
// NUNCA lo mueve de su lugar en el catálogo.
const q = query(collection(db, "products"), orderBy("orden", "asc"), orderBy("createdAt", "asc"));

onSnapshot(q, (snapshot) => {
    const products = [];
    snapshot.forEach((docSnap) => products.push(mapDoc(docSnap)));
    applyFirestoreProducts(products);
  }, (error) => {
  console.error("No se pudieron cargar los productos desde Firestore (usando respaldo data.js):", error);
});

