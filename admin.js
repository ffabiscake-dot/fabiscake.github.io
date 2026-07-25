// ============================================================
// admin.js — Panel de administración de Fabi's Cake
// ============================================================
import { ADMIN_EMAIL } from "../js/firebase-config.js";
import {
  auth, db, storage,
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, orderBy, onSnapshot, serverTimestamp,
  ref, uploadBytes, getDownloadURL, deleteObject
} from "../js/firebase-init.js";

// ---------- Referencias DOM ----------
const $ = (id) => document.getElementById(id);

const loginScreen = $("login-screen");
const loginForm = $("login-form");
const loginError = $("login-error");
const adminApp = $("admin-app");

const productGrid = $("product-grid");
const searchInput = $("search-input");
const categoryFilter = $("category-filter");
const loadingIndicator = $("loading-indicator");
const emptyState = $("empty-state");

const productModal = $("product-modal");
const productForm = $("product-form");
const modalTitle = $("modal-title");
const deleteProductBtn = $("delete-product-btn");

const confirmModal = $("confirm-modal");
const cropModal = $("crop-modal");

let allProducts = [];      // cache local de productos
let currentMainImageBlob = null;   // blob ya recortado/comprimido de la imagen principal
let currentExtraImageBlobs = [];   // blobs de imágenes adicionales
let existingMainImageUrl = "";     // url ya guardada (al editar)
let existingExtraUrls = [];        // urls ya guardadas (al editar)
let pendingDeleteId = null;
let cropCallback = null;           // qué hacer con el resultado del recorte

// ============================================================
// 1) AUTENTICACIÓN
// ============================================================
onAuthStateChanged(auth, (user) => {
  if (user && user.email === ADMIN_EMAIL) {
    loginScreen.hidden = true;
    adminApp.hidden = false;
    listenToProducts();
  } else {
    if (user) {
      // Alguien inició sesión pero no es el admin autorizado.
      signOut(auth);
    }
    adminApp.hidden = true;
    loginScreen.hidden = false;
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = $("login-email").value.trim();
  const pass = $("login-pass").value;
  const btn = $("login-btn");
  btn.disabled = true;
  btn.textContent = "Entrando...";
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    loginError.textContent = "Correo o contraseña incorrectos.";
    loginError.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Iniciar sesión";
  }
});

$("logout-btn").addEventListener("click", () => signOut(auth));

// ============================================================
// 2) LISTAR / BUSCAR / FILTRAR PRODUCTOS
// ============================================================
function listenToProducts() {
  loadingIndicator.hidden = false;
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    allProducts = [];
    snapshot.forEach((d) => allProducts.push({ id: d.id, ...d.data() }));
    loadingIndicator.hidden = true;
    populateCategoryFilter();
    renderGrid();
  }, (err) => {
    loadingIndicator.hidden = true;
    showToast("Error cargando productos: " + err.message, "error");
  });
}

function populateCategoryFilter() {
  const cats = [...new Set(allProducts.map(p => p.categoria).filter(Boolean))].sort();
  const current = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
    cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  categoryFilter.value = current;

  const datalist = $("categoria-list");
  datalist.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join("");
}

function renderGrid() {
  const term = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;

  const filtered = allProducts.filter(p => {
    const matchesTerm = !term || (p.nombre || "").toLowerCase().includes(term);
    const matchesCat = !cat || p.categoria === cat;
    return matchesTerm && matchesCat;
  });

  emptyState.hidden = filtered.length !== 0;
  productGrid.innerHTML = filtered.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.imagenPrincipal || 'https://placehold.co/300x300?text=Sin+imagen'}" alt="${escapeHtml(p.nombre || '')}" loading="lazy">
      <div class="product-card-body">
        <p class="product-card-name">${escapeHtml(p.nombre || 'Sin nombre')}</p>
        <p class="product-card-price">$${Number(p.precio || 0).toFixed(2)}</p>
        <div class="product-card-badges">
          <span class="badge badge-cat">${escapeHtml(p.categoria || 'Sin categoría')}</span>
          ${p.estado === 'Agotado' ? '<span class="badge badge-agotado">Agotado</span>' : ''}
          ${p.destacado ? '<span class="badge badge-destacado">★ Destacado</span>' : ''}
        </div>
      </div>
    </div>
  `).join("");

  productGrid.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => openEditModal(card.dataset.id));
  });
}

searchInput.addEventListener("input", renderGrid);
categoryFilter.addEventListener("change", renderGrid);

// ============================================================
// 3) MODAL DE PRODUCTO (crear / editar)
// ============================================================
$("new-product-btn").addEventListener("click", () => openNewModal());
$("modal-close").addEventListener("click", closeProductModal);
$("cancel-btn").addEventListener("click", closeProductModal);

function openNewModal() {
  productForm.reset();
  $("product-id").value = "";
  modalTitle.textContent = "Nuevo producto";
  deleteProductBtn.hidden = true;
  currentMainImageBlob = null;
  currentExtraImageBlobs = [];
  existingMainImageUrl = "";
  existingExtraUrls = [];
  $("main-image-preview").hidden = true;
  renderExtraPreviews();
  productModal.hidden = false;
}

function openEditModal(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  productForm.reset();
  $("product-id").value = id;
  modalTitle.textContent = "Editar producto";
  deleteProductBtn.hidden = false;

  $("f-nombre").value = p.nombre || "";
  $("f-descripcion").value = p.descripcion || "";
  $("f-precio").value = p.precio ?? "";
  $("f-categoria").value = p.categoria || "";
  $("f-estado").value = p.estado || "Disponible";
  $("f-destacado").checked = !!p.destacado;

  currentMainImageBlob = null;
  currentExtraImageBlobs = [];
  existingMainImageUrl = p.imagenPrincipal || "";
  existingExtraUrls = Array.isArray(p.imagenes) ? [...p.imagenes] : [];

  const preview = $("main-image-preview");
  if (existingMainImageUrl) {
    preview.src = existingMainImageUrl;
    preview.hidden = false;
  } else {
    preview.hidden = true;
  }
  renderExtraPreviews();

  productModal.hidden = false;
}

function closeProductModal() {
  productModal.hidden = true;
}

// ---------- Guardar producto (crear o actualizar) ----------
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("product-id").value;
  const saveBtn = $("save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Guardando...";

  try {
    let mainImageUrl = existingMainImageUrl;
    if (currentMainImageBlob) {
      mainImageUrl = await uploadImageBlob(currentMainImageBlob, "products");
    }

    let extraUrls = [...existingExtraUrls];
    if (currentExtraImageBlobs.length) {
      showUploadProgress(true, "Subiendo imágenes adicionales...");
      for (const blob of currentExtraImageBlobs) {
        const url = await uploadImageBlob(blob, "products/extra");
        extraUrls.push(url);
      }
      showUploadProgress(false);
    }

    const payload = {
      nombre: $("f-nombre").value.trim(),
      descripcion: $("f-descripcion").value.trim(),
      precio: parseFloat($("f-precio").value) || 0,
      categoria: $("f-categoria").value.trim(),
      estado: $("f-estado").value,
      destacado: $("f-destacado").checked,
      imagenPrincipal: mainImageUrl,
      imagenes: extraUrls,
      updatedAt: serverTimestamp()
    };

    if (id) {
      await updateDoc(doc(db, "products", id), payload);
      showToast("Producto actualizado ✔", "success");
    } else {
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, "products"), payload);
      showToast("Producto creado ✔", "success");
    }
    closeProductModal();
  } catch (err) {
    showToast("Error al guardar: " + err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Guardar cambios";
  }
});

// ============================================================
// 4) ELIMINAR PRODUCTO (con confirmación)
// ============================================================
deleteProductBtn.addEventListener("click", () => {
  pendingDeleteId = $("product-id").value;
  confirmModal.hidden = false;
});

$("confirm-cancel").addEventListener("click", () => {
  confirmModal.hidden = true;
  pendingDeleteId = null;
});

$("confirm-delete").addEventListener("click", async () => {
  if (!pendingDeleteId) return;
  const btn = $("confirm-delete");
  btn.disabled = true;
  btn.textContent = "Eliminando...";
  try {
    const p = allProducts.find(x => x.id === pendingDeleteId);
    await deleteDoc(doc(db, "products", pendingDeleteId));
    // Intentamos borrar también las imágenes en Storage (best-effort).
    if (p) {
      const urls = [p.imagenPrincipal, ...(p.imagenes || [])].filter(Boolean);
      for (const url of urls) {
        try {
          const path = decodeStoragePath(url);
          if (path) await deleteObject(ref(storage, path));
        } catch (_) { /* si ya no existe, se ignora */ }
      }
    }
    showToast("Producto eliminado", "success");
    confirmModal.hidden = true;
    closeProductModal();
  } catch (err) {
    showToast("Error al eliminar: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sí, eliminar";
    pendingDeleteId = null;
  }
});

function decodeStoragePath(downloadUrl) {
  try {
    const match = downloadUrl.match(/\/o\/(.+)\?/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch { return null; }
}

// ============================================================
// 5) SUBIDA DE IMÁGENES: cámara, galería, recorte, compresión
// ============================================================
$("btn-camera").addEventListener("click", () => $("input-camera").click());
$("btn-gallery").addEventListener("click", () => $("input-gallery").click());
$("btn-add-extra").addEventListener("click", () => $("input-extra").click());

$("input-camera").addEventListener("change", (e) => handleMainImageSelected(e.target.files[0]));
$("input-gallery").addEventListener("change", (e) => handleMainImageSelected(e.target.files[0]));
$("input-extra").addEventListener("change", (e) => {
  [...e.target.files].forEach(file => handleExtraImageSelected(file));
  e.target.value = "";
});

function handleMainImageSelected(file) {
  if (!file) return;
  openCropModal(file, async (blob) => {
    currentMainImageBlob = blob;
    const preview = $("main-image-preview");
    preview.src = URL.createObjectURL(blob);
    preview.hidden = false;
  });
}

function handleExtraImageSelected(file) {
  if (!file) return;
  openCropModal(file, async (blob) => {
    currentExtraImageBlobs.push(blob);
    renderExtraPreviews();
  });
}

function renderExtraPreviews() {
  const container = $("extra-images-preview");
  container.innerHTML = "";

  existingExtraUrls.forEach((url, idx) => {
    const div = document.createElement("div");
    div.className = "extra-thumb";
    div.innerHTML = `<img src="${url}"><button type="button" aria-label="Quitar">✕</button>`;
    div.querySelector("button").addEventListener("click", () => {
      existingExtraUrls.splice(idx, 1);
      renderExtraPreviews();
    });
    container.appendChild(div);
  });

  currentExtraImageBlobs.forEach((blob, idx) => {
    const div = document.createElement("div");
    div.className = "extra-thumb";
    div.innerHTML = `<img src="${URL.createObjectURL(blob)}"><button type="button" aria-label="Quitar">✕</button>`;
    div.querySelector("button").addEventListener("click", () => {
      currentExtraImageBlobs.splice(idx, 1);
      renderExtraPreviews();
    });
    container.appendChild(div);
  });
}

// ---------- Subir un blob ya recortado/comprimido a Storage ----------
async function uploadImageBlob(blob, folder) {
  showUploadProgress(true, "Subiendo imagen...");
  try {
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(storageRef);
    return url;
  } finally {
    showUploadProgress(false);
  }
}

function showUploadProgress(show, text) {
  const box = $("upload-progress");
  const bar = $("upload-progress-bar");
  box.hidden = !show;
  if (show) {
    $("upload-progress-text").textContent = text || "Subiendo...";
    bar.style.width = "70%"; // uploadBytes no reporta progreso incremental; barra indicativa
  } else {
    bar.style.width = "100%";
    setTimeout(() => { bar.style.width = "0%"; }, 300);
  }
}

// ============================================================
// 6) RECORTE DE IMAGEN (crop cuadrado con pan + zoom) + COMPRESIÓN
// ============================================================
const cropStage = $("crop-stage");
const cropImage = $("crop-image");
const cropZoom = $("crop-zoom");

let cropState = { scale: 1, minScale: 1, x: 0, y: 0, naturalW: 0, naturalH: 0, dragging: false, startX: 0, startY: 0 };

function openCropModal(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    cropImage.onload = () => {
      const stageSize = cropStage.clientWidth || 320;
      cropState.naturalW = cropImage.naturalWidth;
      cropState.naturalH = cropImage.naturalHeight;
      const minScale = stageSize / Math.min(cropState.naturalW, cropState.naturalH);
      cropState.minScale = minScale;
      cropState.scale = minScale;
      cropState.x = (stageSize - cropState.naturalW * minScale) / 2;
      cropState.y = (stageSize - cropState.naturalH * minScale) / 2;
      cropZoom.value = 1;
      applyCropTransform();
      cropModal.hidden = false;
    };
    cropImage.src = reader.result;
  };
  reader.readAsDataURL(file);
  cropCallback = onDone;
}

function applyCropTransform() {
  cropImage.style.width = cropState.naturalW * cropState.scale + "px";
  cropImage.style.height = cropState.naturalH * cropState.scale + "px";
  cropImage.style.transform = `translate(${cropState.x}px, ${cropState.y}px)`;
}

function clampCropPosition() {
  const stageSize = cropStage.clientWidth || 320;
  const w = cropState.naturalW * cropState.scale;
  const h = cropState.naturalH * cropState.scale;
  cropState.x = Math.min(0, Math.max(stageSize - w, cropState.x));
  cropState.y = Math.min(0, Math.max(stageSize - h, cropState.y));
}

cropZoom.addEventListener("input", () => {
  const factor = parseFloat(cropZoom.value);
  cropState.scale = cropState.minScale * factor;
  clampCropPosition();
  applyCropTransform();
});

function cropPointerDown(x, y) {
  cropState.dragging = true;
  cropState.startX = x - cropState.x;
  cropState.startY = y - cropState.y;
}
function cropPointerMove(x, y) {
  if (!cropState.dragging) return;
  cropState.x = x - cropState.startX;
  cropState.y = y - cropState.startY;
  clampCropPosition();
  applyCropTransform();
}
function cropPointerUp() { cropState.dragging = false; }

cropStage.addEventListener("pointerdown", (e) => cropPointerDown(e.clientX, e.clientY));
window.addEventListener("pointermove", (e) => cropPointerMove(e.clientX, e.clientY));
window.addEventListener("pointerup", cropPointerUp);

$("crop-close").addEventListener("click", () => { cropModal.hidden = true; });
$("crop-cancel").addEventListener("click", () => { cropModal.hidden = true; });

$("crop-confirm").addEventListener("click", async () => {
  const stageSize = cropStage.clientWidth || 320;
  const OUTPUT_SIZE = 900; // tamaño final del cuadrado, luego se comprime
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");

  // Área visible del recorte, en coordenadas de la imagen original.
  const sx = (0 - cropState.x) / cropState.scale;
  const sy = (0 - cropState.y) / cropState.scale;
  const sSize = stageSize / cropState.scale;

  ctx.drawImage(cropImage, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const blob = await compressCanvas(canvas);
  if (cropCallback) await cropCallback(blob);
  cropModal.hidden = true;
});

// Comprime iterativamente hasta quedar por debajo de ~350KB.
function compressCanvas(canvas, targetKB = 350) {
  return new Promise((resolve) => {
    let quality = 0.85;
    function tryCompress() {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        if (blob.size / 1024 <= targetKB || quality <= 0.4) {
          resolve(blob);
        } else {
          quality -= 0.1;
          tryCompress();
        }
      }, "image/jpeg", quality);
    }
    tryCompress();
  });
}

// ============================================================
// Utilidades
// ============================================================
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

let toastTimer = null;
function showToast(msg, type = "") {
  const toast = $("toast");
  toast.textContent = msg;
  toast.className = "toast" + (type ? " toast-" + type : "");
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}
