/**
 * firebase.js — Servicios Firebase para Portal Mi Salud (ViñaMed)
 * Usar con Vite + React. Para la versión CDN (index.html), ver el bloque
 * <script id="firebase-services"> al final del body.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyBdedhr4yUsc1F665UXeBWBEj03U-ttO6Y",
  authDomain:        "vinamed-10b76.firebaseapp.com",
  projectId:         "vinamed-10b76",
  storageBucket:     "vinamed-10b76.firebasestorage.app",
  messagingSenderId: "902644783277",
  appId:             "1:902644783277:web:ce55f4024a6ce4fd578e24",
  measurementId:     "G-HFLJ6HBZSF"
};

const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// ─── Consentimiento ────────────────────────────────────────────────────────

/** Guarda el consentimiento del paciente con timestamp del servidor. */
export async function guardarConsentimiento(uid, datos) {
  await setDoc(doc(db, 'users', uid, 'legal', 'consentimiento'), {
    aceptado:  true,
    version:   datos.version,
    timestamp: serverTimestamp(),
    items:     datos.items,
  });
}

/** Retorna true si el paciente ya aceptó previamente. */
export async function verificarConsentimiento(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'legal', 'consentimiento'));
  return snap.exists() && snap.data().aceptado === true;
}

/** Cierra la sesión del paciente. */
export async function cerrarSesion() {
  await signOut(auth);
}
