import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizarRut } from '../utils/rut';

export async function solicitarCita(paciente, formData) {
  return await addDoc(collection(db, 'citas'), {
    pacienteRut:      normalizarRut(paciente.rut),
    pacienteNombre:   paciente.nombre,
    pacienteTelefono: paciente.telefono || '',
    tipoAtencion:     formData.tipoAtencion || '',
    preferenciaFecha: formData.fecha || '',
    preferenciaHora:  formData.hora || '',
    notas:            formData.notas || '',
    estado:           'solicitada',
    visiblePaciente:  true,
    creadoEn:         serverTimestamp(),
    actualizadoEn:    serverTimestamp(),
  });
}

export function escucharCitasPaciente(rut, callback) {
  const q = query(
    collection(db, 'citas'),
    where('pacienteRut', '==', normalizarRut(rut)),
    where('visiblePaciente', '==', true),
    orderBy('creadoEn', 'desc')
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
