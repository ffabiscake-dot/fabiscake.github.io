# Fabi´s Cake — Sitio Web

Sitio web estático (HTML/CSS/JS, sin necesidad de instalar nada) para el catálogo,
carrito de compras y pedidos por WhatsApp de **Fabi´s Cake**.

## Estructura del proyecto

```
├── index.html          → página principal
├── css/
│   └── style.css       → todos los estilos
├── js/
│   ├── data.js          → catálogo de productos (nombre, precio, categoría, imagen)
│   └── app.js           → lógica del carrito, WhatsApp, modo oscuro, etc.
├── assets/
│   ├── logo.jpg          → logo del negocio
│   └── products/         → fotos de cada producto
└── README.md
```

## Cómo publicarlo en GitHub Pages (paso a paso)

### 1. Crea un repositorio en GitHub
1. Entra a [github.com](https://github.com) e inicia sesión (o crea una cuenta gratis).
2. Haz clic en **New repository** (botón verde).
3. Ponle un nombre, por ejemplo `fabiscake-web`.
4. Déjalo en **Public**, no marques ninguna casilla adicional, y dale a **Create repository**.

### 2. Sube estos archivos
**Opción A — Sin usar la terminal (más fácil):**
1. En la página de tu repositorio recién creado, haz clic en **uploading an existing file**
   (o **Add file → Upload files**).
2. Arrastra **toda esta carpeta** (todos los archivos y subcarpetas: `index.html`, `css/`, `js/`, `assets/`).
3. Escribe un mensaje como "Primera versión del sitio" y haz clic en **Commit changes**.

**Opción B — Con git desde tu computadora:**
```bash
cd fabiscake-web
git init
git add .
git commit -m "Primera versión del sitio"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/fabiscake-web.git
git push -u origin main
```

### 3. Activa GitHub Pages
1. Dentro del repositorio, ve a **Settings** (⚙️, arriba a la derecha).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En **Source**, selecciona la rama `main` y la carpeta `/ (root)`.
4. Haz clic en **Save**.
5. Espera 1–2 minutos y recarga la página. GitHub te mostrará un enlace como:
   ```
   https://TU-USUARIO.github.io/fabiscake-web/
   ```
   Esa es tu página en vivo — puedes compartir ese enlace con quien quieras.

### 4. Actualizaciones futuras
Cada vez que quieras cambiar un precio, texto o agregar un producto:
- Edita `js/data.js` (ahí están todos los productos, con su nombre, precio, categoría e imagen).
- Sube el archivo modificado de nuevo (Add file → Upload files, o `git push`).
- GitHub Pages se actualiza solo, en 1–2 minutos.

## Notas importantes

- **Número de WhatsApp**: configurado en `js/app.js`, línea `WHATSAPP_NUMBER = "5352076748"`.
  Si cambia el número, edítalo ahí.
- **Todo funciona sin base de datos ni backend**: el carrito vive en la sesión del navegador
  y el pedido se envía directo a WhatsApp al confirmar.
- **Dominio propio (opcional)**: si más adelante compras un dominio (por ejemplo
  `fabiscake.com`), en la misma sección **Settings → Pages** puedes agregarlo en "Custom domain".
