/**
 * ConsentimientoModal.jsx
 * Portal Mi Salud — ViñaMed
 *
 * Muestra la Política de Privacidad y el Consentimiento Informado
 * al primer acceso del paciente. Requiere aceptación explícita antes
 * de permitir el ingreso al Portal.
 *
 * Integración en login:
 *   1. Importar este componente en la pantalla de login.
 *   2. Mostrar ANTES de completar el flujo de autenticación.
 *   3. Al recibir onAceptar(), guardar en Firestore:
 *      users/{uid}/consentimiento: { aceptado: true, timestamp, version }
 *   4. En cada sesión posterior, verificar si consentimiento.aceptado === true.
 *
 * Props:
 *   onAceptar  — función llamada cuando el usuario acepta (guarda en BD y continúa)
 *   onRechazar — función llamada si el usuario rechaza (cierra sesión / vuelve a login)
 */

import { useState } from "react";

const VERSION = "1.0";
const FECHA_VERSION = "Enero 2026";

// ─── Textos ────────────────────────────────────────────────────────────────

const POLITICA = [
  {
    titulo: "1. Responsable del tratamiento",
    contenido:
      "Centro Médico ViñaMed (RUT XXXXXXXX-X), Medio Oriente 831, Of. 408, Viña del Mar, es el responsable del tratamiento de sus datos personales en este Portal, conforme a la Ley N° 19.628 y la Ley N° 20.584.",
  },
  {
    titulo: "2. Datos que tratamos",
    contenido:
      "Tratamos datos de identificación (nombre, RUT, contacto), datos de salud (historia clínica, resultados de exámenes, diagnósticos, alergias, citas) y datos técnicos de acceso (log de sesión, dispositivo). Los datos de salud son datos sensibles según la Ley N° 19.628.",
  },
  {
    titulo: "3. Finalidad del tratamiento",
    contenido:
      "Sus datos se utilizan exclusivamente para: (a) mostrarle su ficha clínica y resultados; (b) gestionar sus citas; (c) enviarle notificaciones de su atención; (d) mantener la seguridad del Portal; (e) cumplir obligaciones legales ante MINSAL.",
  },
  {
    titulo: "4. Comunicación a terceros",
    contenido:
      "ViñaMed no vende sus datos. Solo los comunica a: proveedores tecnológicos (Firebase/Google) bajo contrato de confidencialidad; organismos públicos de salud cuando lo exija la ley; y a otros prestadores de salud únicamente con su consentimiento previo.",
  },
  {
    titulo: "5. Seguridad y conservación",
    contenido:
      "Aplicamos cifrado TLS, control de acceso y registro de auditoría. Su historia clínica se conserva 15 años (D.S. 41/2012 MINSAL). Los logs de acceso se conservan 1 año. Los datos de contacto mientras mantenga relación con el Centro.",
  },
  {
    titulo: "6. Sus derechos",
    contenido:
      "Tiene derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) según la Ley N° 19.628, y derechos especiales como paciente (acceder a su ficha, corregir errores, designar quién puede verla) según la Ley N° 20.584. Escríbanos a privacidad@vinamed.cl.",
  },
  {
    titulo: "7. Marco legal",
    contenido:
      "Ley N° 19.628 (datos personales) · Ley N° 20.584 (derechos del paciente) · D.S. N° 41/2012 MINSAL (ficha clínica) · Ley N° 19.799 (firma electrónica) · Boletín 11.144-07 (nueva ley de datos, en tramitación).",
  },
];

const CONSENTIMIENTO_ITEMS = [
  "Acceder, visualizar y descargar mi ficha clínica electrónica, incluyendo resultados de exámenes, informes médicos y diagnósticos.",
  "Tratar mis datos de salud para la gestión de citas (agendamiento, confirmación, modificación y cancelación).",
  "Enviarme notificaciones relacionadas con mi atención médica (resultados disponibles, recordatorios de citas) por mensajería interna, correo o SMS según mis preferencias.",
  "Conservar un registro de auditoría de mis accesos al Portal (log de sesión) con fines de seguridad, conforme al Art. 12 de la Ley N° 20.584.",
  "Almacenar mis datos en la infraestructura de Firebase (Google LLC) bajo las garantías de confidencialidad descritas en la Política de Privacidad.",
];

// ─── Subcomponentes ────────────────────────────────────────────────────────

function Seccion({ titulo, contenido }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontWeight: 600, fontSize: 13, color: "#0E7490", margin: "0 0 4px" }}>
        {titulo}
      </p>
      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
        {contenido}
      </p>
    </div>
  );
}

function CheckItem({ label, checked, onChange }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        marginBottom: 12,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ marginTop: 3, accentColor: "#0E7490", width: 16, height: 16, flexShrink: 0 }}
      />
      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{label}</span>
    </label>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function ConsentimientoModal({ onAceptar, onRechazar }) {
  const [tab, setTab] = useState("privacidad"); // "privacidad" | "consentimiento"
  const [checks, setChecks] = useState(Array(CONSENTIMIENTO_ITEMS.length).fill(false));
  const [checkTodos, setCheckTodos] = useState(false);
  const [mayorEdad, setMayorEdad] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const todosAceptados = checks.every(Boolean) && mayorEdad;

  function toggleCheck(i) {
    const nuevo = [...checks];
    nuevo[i] = !nuevo[i];
    setChecks(nuevo);
    setCheckTodos(nuevo.every(Boolean));
  }

  function toggleTodos() {
    const val = !checkTodos;
    setCheckTodos(val);
    setChecks(Array(CONSENTIMIENTO_ITEMS.length).fill(val));
  }

  async function handleAceptar() {
    if (!todosAceptados) return;
    setEnviando(true);
    try {
      // Llamar al callback — quien lo implemente debe guardar en Firestore:
      // users/{uid}/consentimiento: {
      //   aceptado: true,
      //   version: VERSION,
      //   timestamp: serverTimestamp(),
      //   ip: (opcional, del servidor)
      // }
      await onAceptar({
        version: VERSION,
        timestamp: new Date().toISOString(),
        items: CONSENTIMIENTO_ITEMS,
      });
    } finally {
      setEnviando(false);
    }
  }

  // ── Estilos inline (sin dependencias externas) ───────────────────────────

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16,
  };

  const modal = {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 540,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  };

  const header = {
    background: "linear-gradient(135deg, #0E7490 0%, #0F766E 100%)",
    padding: "20px 24px 16px",
    flexShrink: 0,
  };

  const tabBar = {
    display: "flex",
    borderBottom: "1px solid #E5E7EB",
    flexShrink: 0,
    background: "#F9FAFB",
  };

  const tabBtn = (activo) => ({
    flex: 1,
    padding: "12px 0",
    fontSize: 13,
    fontWeight: activo ? 600 : 400,
    color: activo ? "#0E7490" : "#6B7280",
    background: "none",
    border: "none",
    borderBottom: activo ? "2px solid #0E7490" : "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const scroll = {
    overflowY: "auto",
    padding: "20px 24px",
    flex: 1,
  };

  const footer = {
    padding: "16px 24px",
    borderTop: "1px solid #E5E7EB",
    flexShrink: 0,
    background: "#F9FAFB",
  };

  const btnPrimario = {
    width: "100%",
    padding: "13px 0",
    background: todosAceptados ? "#0E7490" : "#D1D5DB",
    color: todosAceptados ? "#fff" : "#9CA3AF",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: todosAceptados ? "pointer" : "not-allowed",
    transition: "background 0.2s",
    marginBottom: 8,
  };

  const btnSecundario = {
    width: "100%",
    padding: "10px 0",
    background: "none",
    color: "#6B7280",
    border: "1px solid #D1D5DB",
    borderRadius: 10,
    fontSize: 13,
    cursor: "pointer",
  };

  const aviso = {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#92400E",
    lineHeight: 1.5,
    marginBottom: 16,
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* HEADER */}
        <div style={header}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: "0 0 2px" }}>
            Centro Médico ViñaMed · Portal Mi Salud
          </p>
          <p style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>
            Privacidad y consentimiento
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, margin: 0 }}>
            Versión {VERSION} · {FECHA_VERSION}
          </p>
        </div>

        {/* TABS */}
        <div style={tabBar}>
          <button style={tabBtn(tab === "privacidad")} onClick={() => setTab("privacidad")}>
            Política de privacidad
          </button>
          <button style={tabBtn(tab === "consentimiento")} onClick={() => setTab("consentimiento")}>
            Consentimiento informado
          </button>
        </div>

        {/* CONTENIDO */}
        <div style={scroll}>
          {tab === "privacidad" && (
            <>
              <p style={{ fontSize: 13, color: "#6B7280", marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
                Lea cómo tratamos sus datos de salud antes de aceptar. Su información clínica
                es un dato sensible y la protegemos conforme a la ley chilena.
              </p>
              {POLITICA.map((s) => (
                <Seccion key={s.titulo} titulo={s.titulo} contenido={s.contenido} />
              ))}
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8, lineHeight: 1.5 }}>
                Para más información o para ejercer sus derechos, contacte a{" "}
                <span style={{ color: "#0E7490" }}>privacidad@vinamed.cl</span>
              </p>
            </>
          )}

          {tab === "consentimiento" && (
            <>
              <div style={aviso}>
                <strong>Aviso de emergencias:</strong> La mensajería del Portal es para consultas
                no urgentes. En caso de emergencia llame al 131 (SAMU).
              </div>

              <p style={{ fontSize: 13, color: "#374151", marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
                Para usar el Portal, necesitamos su autorización expresa para tratar sus datos de
                salud. Puede revocar este consentimiento en cualquier momento sin perjuicio de su
                atención presencial.
              </p>

              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                Autorizo a Centro Médico ViñaMed a:
              </p>

              {/* Toggle todos */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#F0FDFA",
                  borderRadius: 8,
                  cursor: "pointer",
                  marginBottom: 16,
                  border: "1px solid #99F6E4",
                }}
              >
                <input
                  type="checkbox"
                  checked={checkTodos}
                  onChange={toggleTodos}
                  style={{ accentColor: "#0E7490", width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F766E" }}>
                  Aceptar todos los puntos
                </span>
              </label>

              {CONSENTIMIENTO_ITEMS.map((item, i) => (
                <CheckItem
                  key={i}
                  label={`${String.fromCharCode(65 + i)}. ${item}`}
                  checked={checks[i]}
                  onChange={() => toggleCheck(i)}
                />
              ))}

              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16, marginTop: 8 }}>
                <CheckItem
                  label="Confirmo ser mayor de 18 años o actuar como representante legal del paciente titular de los datos."
                  checked={mayorEdad}
                  onChange={() => setMayorEdad(!mayorEdad)}
                />
              </div>

              {!todosAceptados && (
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8 }}>
                  Debe marcar todos los puntos para continuar.
                </p>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div style={footer}>
          {tab === "privacidad" ? (
            <button
              style={{ ...btnPrimario, background: "#0E7490", color: "#fff", cursor: "pointer" }}
              onClick={() => setTab("consentimiento")}
            >
              Continuar al consentimiento →
            </button>
          ) : (
            <button
              style={btnPrimario}
              onClick={handleAceptar}
              disabled={!todosAceptados || enviando}
            >
              {enviando ? "Registrando..." : "Acepto y accedo al Portal"}
            </button>
          )}
          <button style={btnSecundario} onClick={onRechazar}>
            No acepto — volver al inicio
          </button>
          <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: "8px 0 0" }}>
            Su aceptación queda registrada con sello de fecha y hora · Ley N° 19.628 · Ley N° 20.584
          </p>
        </div>
      </div>
    </div>
  );
}

/*
──────────────────────────────────────────────────
GUÍA DE INTEGRACIÓN PARA CLAUDE CODE
──────────────────────────────────────────────────

1. COLOCAR ARCHIVO:
   Copiar este archivo a: src/components/ConsentimientoModal.jsx

2. INTEGRAR EN LOGIN (LoginScreen.jsx o similar):

   import ConsentimientoModal from '../components/ConsentimientoModal';

   const [mostrarConsentimiento, setMostrarConsentimiento] = useState(false);

   // Después de validar RUT + código, ANTES de redirigir al home:
   async function handleLogin() {
     const user = await autenticar(rut, codigo);
     const yaAcepto = await verificarConsentimiento(user.uid); // Firestore
     if (!yaAcepto) {
       setMostrarConsentimiento(true);
     } else {
       navigate('/home');
     }
   }

   // En el render:
   {mostrarConsentimiento && (
     <ConsentimientoModal
       onAceptar={async (datos) => {
         await guardarConsentimiento(user.uid, datos); // Firestore
         setMostrarConsentimiento(false);
         navigate('/home');
       }}
       onRechazar={() => {
         cerrarSesion();
         setMostrarConsentimiento(false);
       }}
     />
   )}

3. FUNCIÓN EN FIRESTORE (firestore.js o similar):

   import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

   export async function guardarConsentimiento(uid, datos) {
     await setDoc(doc(db, 'users', uid, 'legal', 'consentimiento'), {
       aceptado: true,
       version: datos.version,
       timestamp: serverTimestamp(),
       items: datos.items,
     });
   }

   export async function verificarConsentimiento(uid) {
     const snap = await getDoc(doc(db, 'users', uid, 'legal', 'consentimiento'));
     return snap.exists() && snap.data().aceptado === true;
   }

4. REGLAS DE FIRESTORE (firestore.rules):

   match /users/{uid}/legal/{doc} {
     allow read, write: if request.auth.uid == uid;
   }

──────────────────────────────────────────────────
*/
