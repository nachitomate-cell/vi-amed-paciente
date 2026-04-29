import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { dbVinamed } from '../lib/firebase';
import { normalizarRut } from '../utils/rut';

/**
 * Retorna todos los slots disponibles de todos los tecnólogos
 * para un rango de fechas, agrupados por fecha y profesional.
 */
export async function obtenerDisponibilidad(
  fechaInicio,
  fechaFin,
  duracionMinutos = 30
) {
  // 1. Cargar profesionales activos de tipo tecnólogo
  const profSnap = await getDocs(
    query(
      collection(dbVinamed, 'profesionales'),
      where('rol', '==', 'tecnologo'),
      where('activo', '==', true)
    )
  );
  const profesionales = profSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 2. Cargar horarios de cada profesional
  const horariosSnap = await getDocs(collection(dbVinamed, 'horarios'));
  const horariosPorProf = {};
  horariosSnap.docs.forEach((d) => {
    horariosPorProf[d.data().profesionalId] = d.data();
  });

  // 3. Cargar citas existentes en el rango
  const citasSnap = await getDocs(
    query(
      collection(dbVinamed, 'citas'),
      where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
      where('fecha', '<=', Timestamp.fromDate(fechaFin)),
      where('estado', 'in', ['solicitada', 'confirmada'])
    )
  );
  const citas = citasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 4. Cargar bloqueos en el rango
  const bloqueosSnap = await getDocs(
    query(
      collection(dbVinamed, 'bloqueos'),
      where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
      where('fecha', '<=', Timestamp.fromDate(fechaFin))
    )
  );
  const bloqueos = bloqueosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 5. Generar slots disponibles por día y profesional
  const resultado = [];
  const dias = [];
  const cur = new Date(fechaInicio);

  while (cur <= fechaFin) {
    dias.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  for (const dia of dias) {
    const diaSemana = dia.getDay(); // 0=Dom, 1=Lun...
    const fechaStr = dia.toISOString().split('T')[0];

    for (const prof of profesionales) {
      const horario = horariosPorProf[prof.id];
      if (!horario) continue;
      if (!Array.isArray(horario.diasSemana) || !horario.diasSemana.includes(diaSemana)) continue;

      const slots = generarSlots(
        dia,
        horario.horaInicio,
        horario.horaFin,
        duracionMinutos,
        horario.tiempoMuertoMinutos || 0
      );

      const citasProf = citas.filter(
        (c) =>
          c.profesionalId === prof.id &&
          c.fecha?.toDate?.()?.toISOString().split('T')[0] === fechaStr
      );

      const bloqueosProf = bloqueos.filter(
        (b) =>
          b.profesionalId === prof.id &&
          b.fecha?.toDate?.()?.toISOString().split('T')[0] === fechaStr
      );

      const slotsLibres = slots.filter(
        (slot) =>
          !estaOcupado(slot, citasProf, duracionMinutos) && !estaBloqueado(slot, bloqueosProf)
      );

      if (slotsLibres.length > 0) {
        resultado.push({
          fecha: fechaStr,
          diaNombre: dia.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }),
          profesional: prof,
          slots: slotsLibres,
        });
      }
    }
  }

  return resultado;
}

function generarSlots(dia, horaInicio, horaFin, duracion, tiempoMuerto) {
  const slots = [];
  const [hIni, mIni] = (horaInicio || '08:00').split(':').map(Number);
  const [hFin, mFin] = (horaFin || '17:00').split(':').map(Number);

  const inicio = new Date(dia);
  inicio.setHours(hIni, mIni, 0, 0);
  const fin = new Date(dia);
  fin.setHours(hFin, mFin, 0, 0);

  const cur = new Date(inicio);
  while (cur < fin) {
    const slotFin = new Date(cur);
    slotFin.setMinutes(slotFin.getMinutes() + duracion);
    if (slotFin <= fin) {
      slots.push({
        horaInicio: cur.toTimeString().slice(0, 5),
        timestamp: new Date(cur),
      });
    }
    cur.setMinutes(cur.getMinutes() + duracion + (tiempoMuerto || 0));
  }
  return slots;
}

function estaOcupado(slot, citas, duracion) {
  return (citas || []).some((cita) => {
    const citaInicio = cita.fecha?.toDate?.();
    if (!citaInicio) return false;
    const citaFin = new Date(citaInicio);
    citaFin.setMinutes(citaFin.getMinutes() + (cita.duracionMinutos || duracion));
    const slotFin = new Date(slot.timestamp);
    slotFin.setMinutes(slotFin.getMinutes() + duracion);
    return slot.timestamp < citaFin && slotFin > citaInicio;
  });
}

function estaBloqueado(slot, bloqueos) {
  return (bloqueos || []).some((b) => {
    if (b.diaCompleto) return true;
    if (!b.horaInicio || !b.horaFin) return false;
    return slot.horaInicio >= b.horaInicio && slot.horaInicio < b.horaFin;
  });
}

/**
 * Crea la cita en Firestore cuando el paciente confirma.
 */
export async function crearCitaDesdeApp(paciente, slot, tipoAtencion) {
  // Verificar que el slot sigue libre justo antes de crear
  const margenInicio = new Date(slot.timestamp);
  margenInicio.setMinutes(margenInicio.getMinutes() - 1);
  const margenFin = new Date(slot.timestamp);
  margenFin.setMinutes(margenFin.getMinutes() + 1);

  const conflicto = await getDocs(
    query(
      collection(dbVinamed, 'citas'),
      where('profesionalId', '==', slot.profesional.id),
      where('fecha', '>=', Timestamp.fromDate(margenInicio)),
      where('fecha', '<=', Timestamp.fromDate(margenFin)),
      where('estado', 'in', ['solicitada', 'confirmada'])
    )
  );

  if (!conflicto.empty) {
    throw new Error('SLOT_OCUPADO');
  }

  return addDoc(collection(dbVinamed, 'citas'), {
    // Paciente
    pacienteRut: normalizarRut(paciente.rut),
    pacienteNombre: paciente.nombreCompleto || paciente.nombre || '',
    pacienteTelefono: paciente.telefono || '',

    // Profesional y atención
    profesionalId: slot.profesional.id,
    profesionalNombre: slot.profesional.nombre,
    profesionalRol: slot.profesional.rol,
    tipoAtencion,

    // Tiempo y lugar
    fecha: Timestamp.fromDate(slot.timestamp),
    duracionMinutos: 30,
    box: 'Of. 408, Medio Oriente 831',

    // Estado
    estado: 'confirmada',
    visiblePaciente: true,

    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
    origenCita: 'app_paciente',
  });
}

