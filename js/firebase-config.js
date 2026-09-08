// ============================================================
// firebase-config.js
// Configuración central de Firebase para Fabi's Cake.
// ============================================================
// PASO A SEGUIR: reemplaza los valores de abajo con los que te da
// tu propio proyecto de Firebase (Configuración del proyecto ->
// "Tus apps" -> ícono web </> -> "Config").
// NO necesitas ocultar estas claves: son públicas por diseño en
// Firebase. La seguridad real la dan las "reglas" de Firestore y
// Storage (firestore.rules / storage.rules), no estas claves.
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyBxMVxqi0CFru50vQPDk7RYA136qBT38a4",
  authDomain: "fabi-s-cake-b8d4a.firebaseapp.com",
  projectId: "fabi-s-cake-b8d4a",
  storageBucket: "fabi-s-cake-b8d4a.firebasestorage.app",
  messagingSenderId: "827286701975",
  appId: "1:827286701975:web:49318a0a4fe5aead1d66d2"
};

// Correo del único administrador autorizado.
// Debe coincidir EXACTAMENTE con el usuario que crees en
// Firebase Authentication (paso 4 de INSTRUCCIONES.md).
export const ADMIN_EMAIL = "ffabiscake@gmail.com";
