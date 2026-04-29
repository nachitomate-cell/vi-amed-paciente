import { signInWithEmailAndPassword,
         browserLocalPersistence,
         setPersistence }         from 'firebase/auth';
import { collection, query,
         where, getDocs }         from 'firebase/firestore';
import { authVinamed, dbVinamed } from './firebase';
import { normalizarRut }          from './rut';

export async function loginConEmail(email: string, password: string) {
  await setPersistence(authVinamed, browserLocalPersistence);
  const cred = await signInWithEmailAndPassword(
    authVinamed,
    email.trim(),
    password
  );
  return cred.user;
}

export async function loginPaciente(rut: string, password: string) {
  // 1. Buscar el email asociado al RUT en Firestore
  const q = query(
    collection(dbVinamed, 'users'),
    where('rut',  '==', normalizarRut(rut)),
    where('rol',  '==', 'paciente'),
    where('estado', '==', 'activo')
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('RUT no encontrado. ¿Ya tienes cuenta?');
  }

  const email = snap.docs[0].data().email as string;

  // 2. Autenticar con Firebase Auth usando email + contraseña
  await setPersistence(authVinamed, browserLocalPersistence);
  const cred = await signInWithEmailAndPassword(
    authVinamed, email, password
  );
  return cred.user;
}
