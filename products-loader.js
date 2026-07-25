// ============================================================
// products-loader.js
// Sustituye a "js/data.js" estático. Carga los productos desde
// Firestore en tiempo real y los deja disponibles en la variable
// global `window.PRODUCTS` con el mismo formato que ya usa tu
// app.js actual, para no romper nada del carrito / render.
//
// CÓMO SE USA en index.html:
//   1) Borra (o deja, no molesta) la carga de <script src="js/data.js">
//   2) Agrega ANTES de tu app.js:
//        <script type="module" src="js/products-loader.js"></script>
//   3) En tu app.js, en vez de usar la constante "products" ya
//      cargada, dispara el render dentro de:
//        window.addEventListener('products:ready', (e) => {
//          renderCatalogo(e.detail.products); // tu función existente
//        });
//      Si tu app.js ya tiene una función tipo renderProducts(products)
//      solo necesitas llamarla ahí adentro.
// ============================================================
import { db, collection, query, orderBy, onSnapshot } from "./firebase-init.js";

const CACHE_KEY = "fabiscake_products_cache_v1";

function paintFromCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const products = JSON.parse(cached);
      window.PRODUCTS = products;
      window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache: true } }));
    } catch (e) { /* cache corrupta, se ignora */ }
  }
}

// Pinta de inmediato lo último guardado (para que la web cargue
// rápido incluso con mala conexión), y luego se actualiza en vivo.
paintFromCache();

const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const products = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    products.push({
      id: docSnap.id,
      nombre: data.nombre || "",
      descripcion: data.descripcion || "",
      precio: data.precio ?? 0,
      categoria: data.categoria || "Otros",
      estado: data.estado || "Disponible", // "Disponible" | "Agotado"
      destacado: !!data.destacado,
      imagen: data.imagenPrincipal || "",
      imagenes: Array.isArray(data.imagenes) ? data.imagenes : []
    });
  });

  window.PRODUCTS = products;
  localStorage.setItem(CACHE_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent("products:ready", { detail: { products, fromCache: false } }));
}, (error) => {
  console.error("No se pudieron cargar los productos desde Firestore:", error);
  // Si falla (sin internet, reglas, etc.) ya quedó pintado el cache de arriba.
});
