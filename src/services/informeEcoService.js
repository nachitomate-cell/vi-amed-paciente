import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizarRut } from '../utils/rut';

export function escucharResultadosPaciente(rut, callback) {
  const q = query(
    collection(db, 'informes'),
    where('rut', '==', normalizarRut(rut)),
    orderBy('creadoEn', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
