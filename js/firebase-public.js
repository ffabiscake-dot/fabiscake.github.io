// ============================================================
// firebase-public.js
// Inicialización ligera de Firebase para la tienda pública.
// Carga solo Firebase App + Firestore; Authentication y Storage
// se reservan para las páginas de administración.
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { collection, onSnapshot };
