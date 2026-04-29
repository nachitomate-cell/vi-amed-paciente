import { useState } from 'react';
import PasoDisponibilidad, { type GrupoDisp } from './PasoDisponibilidad';
import PasoConfirmacion from './PasoConfirmacion';
import { PRESTACIONES_ECO } from '../../constants/prestacionesEco';
import { crearCitaDesdeApp } from '../../services/disponibilidadService';

type SlotElegido = (GrupoDisp & { slotElegido: { horaInicio: string; timestamp: Date } }) | null;

interface Props {
  pacienteActual: { rut: string; nombreCompleto: string; telefono?: string } | null;
  onCerrar: () => void;
  mostrarToast: (msg: string, tipo?: 'error' | 'ok') => void;
}

export default function BottomSheetSolicitud({ pacienteActual, onCerrar, mostrarToast }: Props) {
  const [paso, setPaso] = useState(1);

  // Estados del formulario
  const [tipoAtencion, setTipoAtencion] = useState('');
  const [slotElegido, setSlotElegido] = useState<SlotElegido>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleConfirmar() {
    if (!slotElegido || !pacienteActual) return;
    setEnviando(true);
    try {
      await crearCitaDesdeApp(
        pacienteActual,
        {
          profesional: slotElegido.profesional,
          timestamp: slotElegido.slotElegido.timestamp,
        },
        tipoAtencion
      );
      setEnviado(true);
      onCerrar();
      mostrarToast('Cita confirmada', 'ok');
    } catch (e: any) {
      if (String(e?.message) === 'SLOT_OCUPADO') {
        mostrarToast('Esa hora ya fue tomada. Elige otra.', 'error');
        setPaso(2);
        setSlotElegido(null);
      } else {
        mostrarToast('Error al confirmar. Intenta de nuevo.', 'error');
      }
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) return null;

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '0 0 10px' }}>
        Paso {paso} de 3
      </p>

      {paso === 1 && (
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12 }}>
            ¿Qué tipo de ecografía necesitas?
          </p>

          <div style={{ display: 'grid', gap: 8 }}>
            {PRESTACIONES_ECO.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setTipoAtencion(p.label);
                  setPaso(2);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: tipoAtencion === p.label ? '1.5px solid #0E7490' : '0.5px solid var(--color-border-tertiary)',
                  background: 'var(--color-background-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-tertiary)' }}>{p.grupo}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === 2 && (
        <PasoDisponibilidad
          tipoAtencion={tipoAtencion}
          onSeleccionar={(datos) => {
            setSlotElegido(datos);
            setPaso(3);
          }}
        />
      )}

      {paso === 3 && (
        <PasoConfirmacion
          tipoAtencion={tipoAtencion}
          slotElegido={slotElegido}
          pacienteActual={pacienteActual}
          enviando={enviando}
          onConfirmar={handleConfirmar}
        />
      )}

      {paso > 1 && (
        <button
          onClick={() => setPaso((p) => p - 1)}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '12px 0',
            borderRadius: 12,
            border: '0.5px solid var(--color-border-secondary)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Volver
        </button>
      )}
    </div>
  );
}

