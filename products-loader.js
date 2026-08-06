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

const CACHE_KEY = "fabiscake_products_cache_v1";

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
    destacado: !!d.destacado
  };
}

function dispatchProducts(products, fromCache) {
  window.PRODUCTS = products;
  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache } }));
}

// Pinta de inmediato lo último guardado (carga rápida / offline).
const cached = localStorage.getItem(CACHE_KEY);
if (cached) {
  try { dispatchProducts(JSON.parse(cached), true); } catch (_) {}
}

const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const products = [];
  snapshot.forEach((docSnap) => products.push(mapDoc(docSnap)));
  localStorage.setItem(CACHE_KEY, JSON.stringify(products));
  dispatchProducts(products, false);
}, (error) => {
  console.error("No se pudieron cargar los productos desde Firestore:", error);
});

