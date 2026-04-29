import type { GrupoDisp } from './PasoDisponibilidad';

interface Props {
  tipoAtencion: string;
  slotElegido: (GrupoDisp & { slotElegido: { horaInicio: string; timestamp: Date } }) | null;
  pacienteActual: { nombreCompleto?: string; rut?: string } | null;
  enviando: boolean;
  onConfirmar: () => void;
}

export default function PasoConfirmacion({ tipoAtencion, slotElegido, pacienteActual, enviando, onConfirmar }: Props) {
  if (!slotElegido) return null;

  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 20 }}>
        Confirma tu cita
      </p>

      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
        {[
          { label: 'Tipo de atención', valor: tipoAtencion },
          { label: 'Profesional', valor: slotElegido.profesional.nombre },
          { label: 'Fecha', valor: slotElegido.diaNombre },
          { label: 'Hora', valor: slotElegido.slotElegido.horaInicio },
          { label: 'Lugar', valor: 'Of. 408, Medio Oriente 831' },
        ].map(({ label, valor }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' }}>{valor}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, padding: '12px 18px', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 4px' }}>Tus datos</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
          {pacienteActual?.nombreCompleto} · {pacienteActual?.rut}
        </p>
      </div>

      <div
        style={{
          background: '#FFF7ED',
          border: '1px solid #FED7AA',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 12,
          color: '#92400E',
          lineHeight: 1.6,
        }}
      >
        ⚠️ La cita quedará confirmada. Recibirás un recordatorio 24 horas antes. Para cancelar, hazlo con al menos 2 horas
        de anticipación desde la sección Citas.
      </div>

      <button
        onClick={onConfirmar}
        disabled={enviando}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: '#0E7490',
          color: '#fff',
          fontSize: 15,
          fontWeight: 600,
          cursor: enviando ? 'not-allowed' : 'pointer',
          opacity: enviando ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {enviando ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin .8s linear infinite' }}>
              <circle cx="7" cy="7" r="5.5" stroke="#fff" strokeWidth="1.5" strokeDasharray="20 14" strokeLinecap="round" fill="none" />
            </svg>
            Confirmando...
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </>
        ) : (
          'Confirmar cita'
        )}
      </button>
    </div>
  );
}

