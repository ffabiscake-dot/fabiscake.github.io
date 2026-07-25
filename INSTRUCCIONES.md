# Fabi's Cake — Panel de Administración
## Guía completa de instalación, publicación y uso desde tu Android

Esta guía asume que tu sitio actual vive en el repositorio
`ffabiscake-dot/fabiscake.github.io`, con esta estructura:

```
index.html
css/style.css
js/data.js
js/app.js
assets/logo.jpg
assets/products/...
```

Y que vamos a **agregar** archivos nuevos sin borrar los que ya tienes
(tu diseño y funcionalidades actuales — carrito, WhatsApp, modo oscuro —
no se tocan).

---

## Archivos que estás recibiendo

```
fabiscake-admin/
├── admin/
│   ├── admin.html        → panel de administración
│   ├── admin.css         → estilos del panel
│   ├── admin.js          → lógica del panel (login, CRUD, imágenes)
│   └── migrar.html       → herramienta de un solo uso para pasar
│                            tus productos actuales a Firestore
├── js/
│   ├── firebase-config.js   → AQUÍ pones tus claves de Firebase
│   ├── firebase-init.js     → inicialización interna (no tocar)
│   └── products-loader.js   → hace que index.html lea de Firestore
├── manifest.json         → PWA
├── service-worker.js      → PWA (funcionamiento offline básico)
├── firestore.rules        → reglas de seguridad de la base de datos
└── storage.rules          → reglas de seguridad de las imágenes
```

---

## PASO 1 — Crear el proyecto de Firebase

1. Entra a **https://console.firebase.google.com** con tu cuenta de Google.
2. Clic en **"Agregar proyecto"**. Nómbralo, por ejemplo, `fabiscake-web`.
3. Puedes desactivar Google Analytics (no es necesario). Crea el proyecto.

## PASO 2 — Registrar tu app web

1. Dentro del proyecto, clic en el ícono **`</>`** (Web) para agregar una app.
2. Ponle un apodo, por ejemplo `fabiscake-sitio`. **No** actives Firebase Hosting
   (usaremos GitHub Pages, como ya tienes).
3. Firebase te mostrará un bloque `firebaseConfig = {...}`. Copia esos valores.
4. Abre `js/firebase-config.js` y reemplaza `TU_API_KEY`, `TU_PROYECTO`, etc.
   con los valores reales que copiaste.

## PASO 3 — Activar Authentication (inicio de sesión)

1. En el menú lateral: **Build → Authentication → Get started**.
2. Pestaña **Sign-in method** → habilita **"Correo electrónico/contraseña"**.
3. Pestaña **Users** → **"Add user"**. Ingresa el correo y contraseña que
   usarás como administradora (por ejemplo `admin@fabiscake.com`).
4. Abre `js/firebase-config.js` y en `ADMIN_EMAIL` pon ese mismo correo.
5. Abre `firestore.rules` y `storage.rules` y reemplaza
   `"admin@fabiscake.com"` por ese mismo correo en ambos archivos.

> ⚠️ Los tres lugares (firebase-config.js, firestore.rules, storage.rules)
> deben tener **exactamente el mismo correo**, letra por letra.

## PASO 4 — Activar Firestore (base de datos)

1. **Build → Firestore Database → Create database**.
2. Elige **"Start in production mode"** (ya tenemos reglas propias) y
   la región más cercana (ej. `us-east1` o `southamerica-east1`).
3. Cuando esté creada, ve a la pestaña **Rules** y pega el contenido
   completo del archivo `firestore.rules` que te entregué. Clic en **Publish**.

## PASO 5 — Activar Storage (imágenes)

1. **Build → Storage → Get started**. Acepta la región por defecto.
2. Ve a la pestaña **Rules** y pega el contenido completo de
   `storage.rules`. Clic en **Publish**.

> Si tu cuenta de Firebase pide activar el plan de pago ("Blaze") para
> Storage: el plan Blaze tiene una capa gratuita generosa (5GB de
> almacenamiento y 1GB/día de descarga gratis) — para un catálogo de
> repostería normalmente no vas a pagar nada, pero sí necesitas
> tener una tarjeta asociada como respaldo.

---

## PASO 6 — Subir los archivos nuevos a tu repositorio de GitHub

Desde el celular (usando la app de GitHub o el navegador) o desde una
computadora:

1. Entra a tu repo `fabiscake.github.io`.
2. Crea las carpetas y sube estos archivos manteniendo la misma
   estructura de nombres:
   - `admin/admin.html`, `admin/admin.css`, `admin/admin.js`, `admin/migrar.html`
   - `js/firebase-config.js`, `js/firebase-init.js`, `js/products-loader.js`
   - `manifest.json`, `service-worker.js`
3. Mensaje del commit: "Agregar panel de administración".

(En GitHub móvil: entra a la carpeta donde quieres subir el archivo →
menú **⋮** → **"Create new file"** o **"Upload files"**.)

## PASO 7 — Conectar tu `index.html` actual a Firestore

Abre tu `index.html` y haz estos 2 cambios pequeños, **sin borrar nada
de tu diseño actual**:

1. Justo **antes** de la línea que carga tu `js/app.js`, agrega:
   ```html
   <script type="module" src="js/products-loader.js"></script>
   ```

2. Dentro de tu `js/app.js`, busca dónde usas la lista de productos
   (probablemente algo como `const productos = [...]` que venía de
   `js/data.js`) y envuélvelo así:
   ```js
   window.addEventListener('products:ready', (e) => {
     const productos = e.detail.products;
     // aquí llama a la misma función que ya usas para pintar
     // el catálogo, por ejemplo: renderCatalogo(productos);
   });
   ```
   Si me compartes el contenido real de tu `js/app.js`, te devuelvo esa
   parte ya editada exactamente — como no tuve acceso de lectura a ese
   archivo específico del repositorio, dejo aquí el patrón general.

3. (Opcional, PWA) Agrega dentro del `<head>`:
   ```html
   <link rel="manifest" href="manifest.json">
   ```
   Y antes de cerrar `</body>`:
   ```html
   <script>
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('service-worker.js');
   }
   </script>
   ```

Sube (commit) los cambios. Espera 1-2 minutos y recarga tu página.

---

## PASO 8 — Migrar tus productos actuales

1. Ve a `https://ffabiscake-dot.github.io/fabiscake.github.io/admin/admin.html`
   e inicia sesión con tu correo/contraseña de administradora.
2. Abre en otra pestaña `.../admin/migrar.html`.
3. Copia el contenido de tu `js/data.js` actual y conviértelo al
   formato JSON de ejemplo que aparece en esa página (nombre,
   descripcion, precio, categoria, imagen, estado, destacado).
4. Pega el JSON y presiona **"Migrar a Firestore"**.
5. Verifica en `admin.html` que todos tus productos aparezcan.

A partir de aquí, **ya no necesitas volver a tocar `js/data.js`**: el
catálogo se lee siempre desde Firestore.

---

## Cómo administrar la página desde tu Android (uso diario)

1. Abre Chrome en tu teléfono y entra a:
   `https://ffabiscake-dot.github.io/fabiscake.github.io/admin/admin.html`
2. (Opcional) Toca el menú ⋮ de Chrome → **"Añadir a pantalla de inicio"**
   para tener un ícono como si fuera una app.
3. Inicia sesión una vez — la sesión se queda guardada.
4. **Agregar producto:** toca "+ Nuevo producto", llena el formulario,
   toca "📷 Cámara" o "🖼️ Galería" para la foto, recórtala arrastrando
   y con el deslizador de zoom, y toca "Usar esta imagen". Luego
   "Guardar cambios".
5. **Editar precio/disponibilidad:** toca la tarjeta del producto,
   cambia el campo que quieras, "Guardar cambios". Se refleja en la
   web en segundos.
6. **Eliminar producto:** ábrelo, toca "Eliminar", confirma.
7. **Buscar/filtrar:** usa la barra de búsqueda o el selector de
   categoría arriba del listado.
8. **Cerrar sesión:** botón arriba a la derecha, cuando termines
   (recomendado si el teléfono es compartido).

---

## Notas de seguridad

- Solo el correo que pusiste en `ADMIN_EMAIL` (y en las reglas) puede
  crear, editar o borrar productos. Cualquier otra persona que intente
  entrar a `admin.html` sin esa cuenta no podrá modificar nada, aunque
  vea el formulario.
- Las claves en `firebase-config.js` son públicas por diseño de
  Firebase — no son una contraseña, son solo un identificador del
  proyecto. La protección real está en `firestore.rules` y
  `storage.rules`.
- Si quieres agregar un segundo administrador, créalo en
  Authentication → Users y cambia la condición del correo en las
  reglas y en `firebase-config.js` (por ejemplo, usando una lista de
  correos permitidos en vez de uno solo — dime si quieres que te
  prepare esa variante).

## Qué no cambia

- Tu carrito de compras, el envío de pedidos por WhatsApp, el modo
  oscuro y todo el diseño visual de `css/style.css` siguen funcionando
  exactamente igual: solo cambiamos **de dónde vienen los datos de los
  productos** (antes `js/data.js` fijo, ahora Firestore editable).
- El sitio sigue publicado 100% gratis en GitHub Pages.
