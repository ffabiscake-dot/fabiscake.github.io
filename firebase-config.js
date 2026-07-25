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
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Correo del único administrador autorizado.
// Debe coincidir EXACTAMENTE con el usuario que crees en
// Firebase Authentication (paso 4 de INSTRUCCIONES.md).
export const ADMIN_EMAIL = "admin@fabiscake.com";
