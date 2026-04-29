import { useEffect, useMemo, useState } from 'react';
import { obtenerDisponibilidad } from '../../services/disponibilidadService';

interface Slot {
  horaInicio: string;
  timestamp: Date;
}

interface Profesional {
  id: string;
  nombre: string;
  color?: string;
  rol?: string;
}

export interface GrupoDisp {
  fecha: string;
  diaNombre: string;
  profesional: Profesional;
  slots: Slot[];
}

interface Props {
  tipoAtencion: string;
  onSeleccionar: (slot: GrupoDisp & { slotElegido: Slot }) => void;
}

export default function PasoDisponibilidad({ tipoAtencion, onSeleccionar }: Props) {
  const [disponibilidad, setDisponibilidad] = useState<GrupoDisp[]>([]);
  const [cargando, setCargando] = useState(true);
  const [slotActivo, setSlotActivo] = useState<string>('');
  const [semanaOffset, setSemanaOffset] = useState(0);

  useEffect(() => {
    void cargarDisponibilidad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaOffset]);

  async function cargarDisponibilidad() {
    setCargando(true);
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() + semanaOffset * 7);
    if (semanaOffset === 0) inicio.setDate(inicio.getDate() + 1); // desde mañana
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 13); // 14 días

    const data = await obtenerDisponibilidad(inicio, fin, 30);
    setDisponibilidad(data as GrupoDisp[]);
    setCargando(false);
  }

  function handleSeleccionar(grupo: GrupoDisp, slot: Slot) {
    const key = `${grupo.profesional.id}-${grupo.fecha}-${slot.horaInicio}`;
    setSlotActivo(key);
    onSeleccionar({ ...grupo, slotElegido: slot });
  }

  const porFecha = useMemo(() => {
    const m: Record<string, GrupoDisp[]> = {};
    disponibilidad.forEach((g) => {
      if (!m[g.fecha]) m[g.fecha] = [];
      m[g.fecha].push(g);
    });
    return m;
  }, [disponibilidad]);

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'spin 1s linear infinite' }}>
          <circle
            cx="16"
            cy="16"
            r="12"
            stroke="#0E7490"
            strokeWidth="2.5"
            strokeDasharray="40 20"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 12 }}>Buscando horas disponibles...</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>{tipoAtencion}</p>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Selecciona una hora disponible</p>

      {Object.keys(porFecha).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            No hay horas disponibles en este período
          </p>
          <button
            onClick={() => setSemanaOffset((o) => o + 2)}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid #0E7490',
              background: 'none',
              color: '#0E7490',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Ver semanas siguientes →
          </button>
        </div>
      ) : (
        <>
          {Object.entries(porFecha).map(([fecha, grupos]) => (
            <div key={fecha} style={{ marginBottom: 24 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  marginBottom: 10,
                }}
              >
                {grupos[0].diaNombre}
              </p>

              {grupos.map((grupo) => (
                <div key={grupo.profesional.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: grupo.profesional.color || '#0E7490',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {grupo.profesional.nombre
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
                      {grupo.profesional.nombre}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
                      {grupo.slots.length} hora{grupo.slots.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {grupo.slots.map((slot) => {
                      const key = `${grupo.profesional.id}-${fecha}-${slot.horaInicio}`;
                      const seleccionado = slotActivo === key;
                      return (
                        <button
                          key={slot.horaInicio}
                          onClick={() => handleSeleccionar(grupo, slot)}
                          style={{
                            padding: '8px 0',
                            borderRadius: 8,
                            border: seleccionado ? '1.5px solid #0E7490' : '0.5px solid var(--color-border-tertiary)',
                            background: seleccionado ? '#0E7490' : 'var(--color-background-primary)',
                            color: seleccionado ? '#fff' : 'var(--color-text-primary)',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all .15s',
                          }}
                        >
                          {slot.horaInicio}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={() => setSemanaOffset((o) => o + 2)}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: '0.5px solid var(--color-border-secondary)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Ver más fechas →
          </button>
        </>
      )}
    </div>
  );
}

