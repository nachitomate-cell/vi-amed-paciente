import { useState, useEffect } from 'react';
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

  const [animar, setAnimar] = useState(false);

  // Bloquear scroll del body cuando el sheet está abierto
  useEffect(() => {
    setAnimar(true);
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width    = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width    = '';
    };
  }, []);

  function handleCerrar() {
    setAnimar(false);
    setTimeout(onCerrar, 300);
  }

  if (enviado) return null;

  const titulos = ['Tipo de atención', 'Disponibilidad', 'Confirmación'];

  return (
    <>
      {/* Contenedor overlay (fondo oscuro) */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
        opacity: animar ? 1 : 0,
        transition: 'opacity 0.3s ease',
        touchAction: 'none',
      }} onClick={handleCerrar} />

      {/* El sheet en sí */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 101,
        background: 'var(--color-background-primary)',
        borderRadius: '20px 20px 0 0',
        height: '92svh',
        maxHeight: '92svh',
        display: 'flex',
        flexDirection: 'column',
        transform: animar ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        paddingBottom: 0,
      }}>
        {/* Drag handle */}
        <div style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: 'var(--color-border-secondary)',
          margin: '12px auto 0',
          flexShrink: 0,
        }} />

        {/* Header fijo */}
        <div style={{
          flexShrink: 0,
          padding: '12px 20px 0',
          textAlign: 'center',
          position: 'relative',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600,
                      color: 'var(--color-text-primary)', margin: '0 0 2px' }}>
            Solicitar Cita
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>
            {titulos[paso - 1]}
          </p>
          {/* Botón cerrar */}
          <button onClick={handleCerrar} style={{
            position: 'absolute', right: 16, top: 12,
            background: 'var(--color-background-secondary)',
            border: 'none', borderRadius: '50%',
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 14,
            color: 'var(--color-text-secondary)',
          }}>✕</button>
        </div>

        {/* Barra de progreso */}
        <div style={{ flexShrink: 0, padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', gap: 4, height: 4 }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  flex: 1,
                  borderRadius: 2,
                  background: n <= paso ? '#0E7490' : 'var(--color-border-tertiary)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 20px',
          WebkitOverflowScrolling: 'touch',
        }}>
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
        </div>

        {/* Botones fijos abajo */}
        <div style={{
          flexShrink: 0,
          padding: '12px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          background: 'var(--color-background-primary)',
          display: 'flex',
          gap: 10,
        }}>
          {paso > 1 && (
            <button
              onClick={() => setPaso((p) => p - 1)}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 12,
                border: '0.5px solid var(--color-border-secondary)',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Atrás
            </button>
          )}
          {paso === 3 && (
            <button
              onClick={handleConfirmar}
              disabled={enviando}
              style={{
                flex: 2,
                padding: '12px 0',
                borderRadius: 12,
                border: 'none',
                background: '#0E7490',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: enviando ? 'not-allowed' : 'pointer',
                opacity: enviando ? 0.7 : 1,
              }}
            >
              {enviando ? 'Confirmando...' : 'Confirmar Cita'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

