import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBxMVxqi0CFru50VQPDk7RYA136qBT3Bs4",
  authDomain: "fabi-s-cake-b8d4a.firebaseapp.com",
  databaseURL: "https://fabi-s-cake-b8d4a-default-rtdb.firebaseio.com",
  projectId: "fabi-s-cake-b8d4a",
  storageBucket: "fabi-s-cake-b8d4a.firebasestorage.app",
  messagingSenderId: "827286701975",
  appId: "1:827286701975:web:49318a0a4fe5acad1d66d2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Referencias del DOM
const loginScreen = document.getElementById('login-screen');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const productGrid = document.getElementById('product-grid');
const emptyState = document.getElementById('empty-state');
const loadingIndicator = document.getElementById('loading-indicator');

const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const cancelBtn = document.getElementById('cancel-btn');
const newProductBtn = document.getElementById('new-product-btn');
const deleteProductBtn = document.getElementById('delete-product-btn');

const confirmModal = document.getElementById('confirm-modal');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmDelete = document.getElementById('confirm-delete');

const imgUrlInput = document.getElementById('f-imagen-url');
const imgPreview = document.getElementById('main-image-preview');

let productosLocales = [];
let productoAEliminarId = null;

// Vista previa de imagen al pegar URL
imgUrlInput.addEventListener('input', () => {
  const url = imgUrlInput.value.trim();
  if (url) {
    imgPreview.src = url;
    imgPreview.hidden = false;
  } else {
    imgPreview.hidden = true;
  }
});

// Control de Sesión
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginScreen.hidden = true;
    adminApp.hidden = false;
    escucharProductos();
  } else {
    loginScreen.hidden = false;
    adminApp.hidden = true;
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    loginError.textContent = "Error al iniciar sesión: " + err.message;
    loginError.hidden = false;
  }
});

// Logout
logoutBtn.addEventListener('click', () => signOut(auth));

// Obtener Productos en tiempo real
function escucharProductos() {
  loadingIndicator.hidden = false;
  onSnapshot(collection(db, "productos"), (snapshot) => {
    productosLocales = [];
    snapshot.forEach((docSnap) => {
      productosLocales.push({ id: docSnap.id, ...docSnap.data() });
    });
    loadingIndicator.hidden = true;
    renderProductos(productosLocales);
  });
}

// Renderizar Tarjetas de Productos
function renderProductos(lista) {
  productGrid.innerHTML = '';
  if (lista.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cssText = 'border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:10px; background:#fff;';
    card.innerHTML = `
      <img src="${p.imagenPrincipal || 'https://via.placeholder.com/150'}" style="width:100%; height:150px; object-fit:cover; border-radius:5px;">
      <h3 style="margin:10px 0 5px 0;">${p.nombre}</h3>
      <p style="color:#666; font-size:14px;">${p.descripcion || ''}</p>
      <p><strong>Precio:</strong> $${p.precio} | <strong>Cat:</strong> ${p.categoria}</p>
      <button class="btn btn-secondary btn-editar" style="margin-top:8px;">✏️ Editar</button>
    `;

    card.querySelector('.btn-editar').addEventListener('click', () => abrirModalEdicion(p));
    productGrid.appendChild(card);
  });
}

// Abrir Modal para Crear
newProductBtn.addEventListener('click', () => {
  productForm.reset();
  document.getElementById('product-id').value = '';
  modalTitle.textContent = "Nuevo producto";
  deleteProductBtn.hidden = true;
  imgPreview.hidden = true;
  productModal.hidden = false;
});

// Abrir Modal para Editar
function abrirModalEdicion(p) {
  document.getElementById('product-id').value = p.id;
  document.getElementById('f-nombre').value = p.nombre || '';
  document.getElementById('f-descripcion').value = p.descripcion || '';
  document.getElementById('f-precio').value = p.precio || 0;
  document.getElementById('f-categoria').value = p.categoria || 'General';
  document.getElementById('f-imagen-url').value = p.imagenPrincipal || '';
  document.getElementById('f-disponible').checked = p.disponible !== false;
  document.getElementById('f-destacado').checked = !!p.destacado;

  if (p.imagenPrincipal) {
    imgPreview.src = p.imagenPrincipal;
    imgPreview.hidden = false;
  } else {
    imgPreview.hidden = true;
  }

  modalTitle.textContent = "Editar producto";
  deleteProductBtn.hidden = false;
  productModal.hidden = false;
}

// Cerrar Modales
const cerrarModal = () => productModal.hidden = true;
modalClose.addEventListener('click', cerrarModal);
cancelBtn.addEventListener('click', cerrarModal);

// Guardar / Actualizar Producto
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('product-id').value;

  const datos = {
    nombre: document.getElementById('f-nombre').value,
    descripcion: document.getElementById('f-descripcion').value,
    precio: Number(document.getElementById('f-precio').value),
    categoria: document.getElementById('f-categoria').value,
    imagenPrincipal: document.getElementById('f-imagen-url').value,
    disponible: document.getElementById('f-disponible').checked,
    destacado: document.getElementById('f-destacado').checked
  };

  try {
    if (id) {
      await updateDoc(doc(db, "productos", id), datos);
    } else {
      await addDoc(collection(db, "productos"), datos);
    }
    cerrarModal();
  } catch (err) {
    alert("Error al guardar: " + err.message);
  }
});

// Eliminar Producto
deleteProductBtn.addEventListener('click', () => {
  productoAEliminarId = document.getElementById('product-id').value;
  confirmModal.hidden = false;
});

confirmCancel.addEventListener('click', () => confirmModal.hidden = true);

confirmDelete.addEventListener('click', async () => {
  if (productoAEliminarId) {
    try {
      await deleteDoc(doc(db, "productos", productoAEliminarId));
      confirmModal.hidden = true;
      cerrarModal();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  }
});
