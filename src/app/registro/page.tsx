'use client';
import { useState }                          from 'react';
import { createUserWithEmailAndPassword }    from 'firebase/auth';
import { doc, setDoc, serverTimestamp }      from 'firebase/firestore';
import { authVinamed, dbVinamed }            from '../../lib/firebase';
import { normalizarRut, validarRut }         from '../../lib/rut';

type Paso = 1 | 2 | 3 | 4;

interface FormData {
  rut:            string;
  nombre:         string;
  apellido:       string;
  fechaNacimiento:string;
  telefono:       string;
  email:          string;
  password:       string;
  passwordConfirm:string;
}

const INICIAL: FormData = {
  rut:'', nombre:'', apellido:'', fechaNacimiento:'',
  telefono:'', email:'', password:'', passwordConfirm:'',
};

export default function RegistroPage() {
  const [paso,      setPaso]     = useState<Paso>(1);
  const [form,      setForm]     = useState<FormData>(INICIAL);
  const [errores,   setErrores]  = useState<Partial<FormData>>({});
  const [cargando,  setCargando] = useState(false);
  const [exito,     setExito]    = useState(false);
  const [errorGral, setErrorGral]= useState('');
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false);
  const [aceptaConsentimiento, setAceptaConsentimiento] = useState(false);

  function update(campo: keyof FormData, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: '' }));
  }

  // ── Validaciones por paso ──────────────────────────────────
  function validarPaso1(): boolean {
    const e: Partial<FormData> = {};
    const rutNorm = normalizarRut(form.rut);
    if (!validarRut(form.rut))
      e.rut = 'RUT inválido — verifica el dígito verificador';
    if (!form.nombre.trim())
      e.nombre = 'Ingresa tu nombre';
    if (!form.apellido.trim())
      e.apellido = 'Ingresa tu apellido';
    if (!form.fechaNacimiento)
      e.fechaNacimiento = 'Ingresa tu fecha de nacimiento';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function validarPaso2(): boolean {
    const e: Partial<FormData> = {};
    if (!/^\+?[\d\s]{8,15}$/.test(form.telefono.trim()))
      e.telefono = 'Teléfono inválido — ej: +56 9 1234 5678';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'Correo electrónico inválido';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function validarPaso3(): boolean {
    const e: Partial<FormData> = {};
    if (form.password.length < 8)
      e.password = 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(form.password))
      e.password = 'Debe incluir al menos una mayúscula';
    if (!/[0-9]/.test(form.password))
      e.password = 'Debe incluir al menos un número';
    if (form.password !== form.passwordConfirm)
      e.passwordConfirm = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function handleSiguiente() {
    if (paso === 1 && validarPaso1()) setPaso(2);
    else if (paso === 2 && validarPaso2()) setPaso(3);
    else if (paso === 3 && validarPaso3()) setPaso(4);
  }

  // ── Registro en Firebase ───────────────────────────────────
  async function handleRegistrar() {
    if (!aceptaPoliticas || !aceptaConsentimiento) {
      setErrorGral('Debes leer y aceptar las políticas y el consentimiento para continuar.');
      return;
    }
    setCargando(true);
    setErrorGral('');

    try {
      // 1. Crear usuario en Firebase Auth
      const cred = await createUserWithEmailAndPassword(
        authVinamed,
        form.email.trim(),
        form.password
      );

      // 2. Crear documento en Firestore
      await setDoc(doc(dbVinamed, 'users', cred.user.uid), {
        uid:            cred.user.uid,
        rut:            normalizarRut(form.rut),
        nombre:         form.nombre.trim(),
        apellido:       form.apellido.trim(),
        nombreCompleto: `${form.nombre.trim()} ${form.apellido.trim()}`,
        fechaNacimiento:form.fechaNacimiento,
        telefono:       form.telefono.trim(),
        email:          form.email.trim(),
        rol:            'paciente',
        estado:         'activo',
        alergiasClinicas:   [],
        alergiasReportadas: [],
        configuracion: {
          notifPush:       true,
          notifEmail:      true,
          notifSMS:        false,
          notifCitas:      true,
          notifResultados: true,
          notifMensajes:   true,
          tamanoTexto:     'normal',
        },
        creadoEn:       serverTimestamp(),
        actualizadoEn:  serverTimestamp(),
      });

      setExito(true);

    } catch (err: any) {
      const mensajes: Record<string, string> = {
        'auth/email-already-in-use':
          'Este correo ya está registrado. ¿Quieres iniciar sesión?',
        'auth/weak-password':
          'Contraseña muy débil. Usa al menos 8 caracteres.',
        'auth/invalid-email':
          'Correo electrónico inválido.',
      };
      setErrorGral(mensajes[err.code] || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  // ── Pantalla de éxito ─────────────────────────────────────
  if (exito) {
    return (
      <div style={{
        minHeight: '100svh',
        background: 'linear-gradient(145deg,#0C4A6E,#0E7490,#0F766E)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16l7 7L26 9" stroke="#fff"
                  strokeWidth="2.5" strokeLinecap="round"
                  strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{ fontSize:22, fontWeight:500, color:'#fff',
                    margin:'0 0 8px', fontFamily:'Georgia,serif',
                    fontStyle:'italic' }}>
          ¡Bienvenido/a!
        </p>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)',
                    lineHeight:1.6, margin:'0 0 32px' }}>
          Tu cuenta fue creada exitosamente.
          <br/>Ya puedes ingresar a Mi Salud.
        </p>
        <a href="/portal" style={{
          display:'block', width:'100%', maxWidth:320,
          padding:'14px 0', borderRadius:12, border:'none',
          background:'#fff', color:'#0C4A6E',
          fontSize:15, fontWeight:600, textAlign:'center',
          textDecoration:'none',
        }}>
          Ir a Mi Salud
        </a>
      </div>
    );
  }

  // ── Layout principal ───────────────────────────────────────
  return (
    <div style={{
      minHeight: '100svh',
      background: 'linear-gradient(145deg,#0C4A6E,#0E7490,#0F766E)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(24px + env(safe-area-inset-top))',
    }}>
      {/* Header */}
      <p style={{ fontSize:22, fontStyle:'italic', fontFamily:'Georgia,serif',
                  color:'#fff', margin:'0 0 4px' }}>Mi Salud</p>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.5)',
                  letterSpacing:'.07em', textTransform:'uppercase',
                  margin:'0 0 28px' }}>
        Crear cuenta · ViñaMed
      </p>

      {/* Indicador de pasos */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            width: paso === n ? 24 : 8,
            height: 8, borderRadius: 4,
            background: n <= paso
              ? '#fff' : 'rgba(255,255,255,0.25)',
            transition: 'all 0.3s',
          }}/>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 20, padding: '28px 24px',
        width: '100%', maxWidth: 400,
      }}>
        {paso === 1 && <Paso1 form={form} errores={errores} update={update}/>}
        {paso === 2 && <Paso2 form={form} errores={errores} update={update}/>}
        {paso === 3 && (
          <Paso3 form={form} errores={errores} update={update}
                 errorGral={errorGral}/>
        )}
        {paso === 4 && (
          <Paso4 
            aceptaPoliticas={aceptaPoliticas} setAceptaPoliticas={setAceptaPoliticas}
            aceptaConsentimiento={aceptaConsentimiento} setAceptaConsentimiento={setAceptaConsentimiento}
            errorGral={errorGral}
          />
        )}

        {/* Botones de navegación */}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          {paso > 1 && (
            <button onClick={() => setPaso(p => (p-1) as Paso)}
                    style={{
                      flex:1, padding:'12px 0', borderRadius:12,
                      border:'1px solid rgba(255,255,255,0.2)',
                      background:'transparent', color:'rgba(255,255,255,0.7)',
                      fontSize:14, cursor:'pointer',
                    }}>
              ← Atrás
            </button>
          )}
          <button
            onClick={paso < 4 ? handleSiguiente : handleRegistrar}
            disabled={cargando || (paso === 4 && (!aceptaPoliticas || !aceptaConsentimiento))}
            style={{
              flex:2, padding:'13px 0', borderRadius:12,
              border:'none', background:'#fff', color:'#0C4A6E',
              fontSize:14, fontWeight:600,
              cursor:(cargando || (paso === 4 && (!aceptaPoliticas || !aceptaConsentimiento))) ? 'not-allowed':'pointer',
              opacity:(cargando || (paso === 4 && (!aceptaPoliticas || !aceptaConsentimiento))) ? 0.7 : 1,
              display:'flex', alignItems:'center',
              justifyContent:'center', gap:8,
            }}>
            {cargando ? 'Creando cuenta...' :
             paso < 4  ? 'Continuar →'     : 'Crear mi cuenta'}
          </button>
        </div>

        {/* Link a login */}
        <p style={{ textAlign:'center', margin:'16px 0 0',
                    fontSize:12, color:'rgba(255,255,255,0.4)' }}>
          ¿Ya tienes cuenta?{' '}
          <a href="/portal" style={{ color:'rgba(255,255,255,0.7)',
                                    textDecoration:'none' }}>
            Ir al portal
          </a>
        </p>
      </div>

      <div style={{ height:'env(safe-area-inset-bottom)' }}/>
    </div>
  );
}

// ── Subcomponentes de cada paso ────────────────────────────────────

function Campo({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize:11, color:'rgba(255,255,255,0.55)',
                  textTransform:'uppercase', letterSpacing:'.05em',
                  margin:'0 0 5px' }}>{label}</p>
      {children}
      {error && (
        <p style={{ fontSize:11, color:'rgba(239,68,68,0.9)',
                    margin:'4px 0 0' }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'12px 14px', borderRadius:10,
  border:'1px solid rgba(255,255,255,0.15)',
  background:'rgba(255,255,255,0.08)', color:'#fff',
  fontSize:15, outline:'none', boxSizing:'border-box',
};

function Paso1({ form, errores, update }: any) {
  return (
    <>
      <p style={{ fontSize:15, fontWeight:500, color:'#fff',
                  margin:'0 0 16px' }}>Datos de identidad</p>
      <Campo label="RUT" error={errores.rut}>
        <input value={form.rut} style={inputStyle} inputMode="numeric"
               placeholder="17.543.210-K"
               onChange={e => update('rut', e.target.value)}/>
      </Campo>
      <Campo label="Nombre" error={errores.nombre}>
        <input value={form.nombre} style={inputStyle} autoCapitalize="words"
               placeholder="Ana"
               onChange={e => update('nombre', e.target.value)}/>
      </Campo>
      <Campo label="Apellido" error={errores.apellido}>
        <input value={form.apellido} style={inputStyle} autoCapitalize="words"
               placeholder="Ramírez"
               onChange={e => update('apellido', e.target.value)}/>
      </Campo>
      <Campo label="Fecha de nacimiento" error={errores.fechaNacimiento}>
        <input value={form.fechaNacimiento} style={inputStyle} type="date"
               onChange={e => update('fechaNacimiento', e.target.value)}/>
      </Campo>
    </>
  );
}

function Paso2({ form, errores, update }: any) {
  return (
    <>
      <p style={{ fontSize:15, fontWeight:500, color:'#fff',
                  margin:'0 0 16px' }}>Datos de contacto</p>
      <Campo label="Teléfono" error={errores.telefono}>
        <input value={form.telefono} style={inputStyle} type="tel"
               inputMode="tel" placeholder="+56 9 1234 5678"
               onChange={e => update('telefono', e.target.value)}/>
      </Campo>
      <Campo label="Correo electrónico" error={errores.email}>
        <input value={form.email} style={inputStyle} type="email"
               inputMode="email" placeholder="ana@correo.cl"
               onChange={e => update('email', e.target.value)}/>
      </Campo>
      <div style={{
        background:'rgba(255,255,255,0.06)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:10, padding:'10px 14px', marginTop:8,
      }}>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)',
                    margin:0, lineHeight:1.6 }}>
          Tu correo se usará para recuperar tu acceso y
          recibir notificaciones de tus citas y resultados.
        </p>
      </div>
    </>
  );
}

function Paso3({ form, errores, update, errorGral }: any) {
  const [verPass,    setVerPass]    = useState(false);
  const [verConfirm, setVerConfirm] = useState(false);

  const requisitos = [
    { ok: form.password.length >= 8,       texto: 'Mínimo 8 caracteres'   },
    { ok: /[A-Z]/.test(form.password),     texto: 'Una mayúscula'         },
    { ok: /[0-9]/.test(form.password),     texto: 'Un número'             },
    { ok: form.password === form.passwordConfirm &&
          form.password.length > 0,         texto: 'Las contraseñas coinciden' },
  ];

  return (
    <>
      <p style={{ fontSize:15, fontWeight:500, color:'#fff',
                  margin:'0 0 16px' }}>Crear contraseña</p>

      <Campo label="Contraseña" error={errores.password}>
        <div style={{ position:'relative' }}>
          <input value={form.password} style={inputStyle}
                 type={verPass ? 'text' : 'password'}
                 placeholder="Mínimo 8 caracteres"
                 onChange={e => update('password', e.target.value)}/>
          <button type="button" onClick={() => setVerPass(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%',
                           transform:'translateY(-50%)', background:'none',
                           border:'none', cursor:'pointer', padding:4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                    stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2"
                      stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none"/>
            </svg>
          </button>
        </div>
      </Campo>

      {/* Indicador de requisitos */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                    gap:4, marginBottom:14 }}>
        {requisitos.map(({ ok, texto }) => (
          <div key={texto} style={{
            display:'flex', alignItems:'center', gap:5,
            fontSize:11,
            color: ok ? '#5DCAA5' : 'rgba(255,255,255,0.35)',
          }}>
            <span style={{ fontSize:10 }}>{ok ? '✓' : '○'}</span>
            {texto}
          </div>
        ))}
      </div>

      <Campo label="Confirmar contraseña" error={errores.passwordConfirm}>
        <div style={{ position:'relative' }}>
          <input value={form.passwordConfirm} style={inputStyle}
                 type={verConfirm ? 'text' : 'password'}
                 placeholder="Repite tu contraseña"
                 onChange={e => update('passwordConfirm', e.target.value)}/>
          <button type="button" onClick={() => setVerConfirm(v => !v)}
                  style={{ position:'absolute', right:12, top:'50%',
                           transform:'translateY(-50%)', background:'none',
                           border:'none', cursor:'pointer', padding:4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                    stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2"
                      stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none"/>
            </svg>
          </button>
        </div>
      </Campo>

      {errorGral && (
        <div style={{
          background:'rgba(239,68,68,0.12)',
          border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:10, padding:'10px 14px',
          fontSize:12, color:'rgba(239,68,68,0.9)',
          lineHeight:1.6,
        }}>
          {errorGral}
        </div>
      )}
    </>
  );
}

function Paso4({ aceptaPoliticas, setAceptaPoliticas, aceptaConsentimiento, setAceptaConsentimiento, errorGral }: any) {
  const [verPoliticas, setVerPoliticas] = useState(false);
  const [verConsent, setVerConsent] = useState(false);

  return (
    <>
      <p style={{ fontSize:15, fontWeight:500, color:'#fff', margin:'0 0 16px' }}>Términos y Condiciones</p>
      
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input 
            id="chk-pol"
            type="checkbox" 
            checked={aceptaPoliticas} 
            onChange={e => setAceptaPoliticas(e.target.checked)}
            style={{ width:20, height:20, marginTop:2, flexShrink:0, cursor:'pointer' }}
          />
          <label htmlFor="chk-pol" style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.4, cursor:'pointer' }}>
            He leído y acepto la <button type="button" onClick={() => setVerPoliticas(true)} style={{ background:'none', border:'none', color:'#fff', padding:0, textDecoration:'underline', cursor:'pointer', fontWeight:600 }}>Política de Privacidad</button> y manejo de datos personales.
          </label>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <input 
            id="chk-con"
            type="checkbox" 
            checked={aceptaConsentimiento} 
            onChange={e => setAceptaConsentimiento(e.target.checked)}
            style={{ width:20, height:20, marginTop:2, flexShrink:0, cursor:'pointer' }}
          />
          <label htmlFor="chk-con" style={{ fontSize:13, color:'rgba(255,255,255,0.8)', lineHeight:1.4, cursor:'pointer' }}>
            Acepto el <button type="button" onClick={() => setVerConsent(true)} style={{ background:'none', border:'none', color:'#fff', padding:0, textDecoration:'underline', cursor:'pointer', fontWeight:600 }}>Consentimiento Informado</button> para el uso del Portal del Paciente y telemedicina.
          </label>
        </div>
      </div>

      {/* Modal para Políticas */}
      {verPoliticas && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:20, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ margin:0, fontWeight:700, color:'#0f172a' }}>Política de Privacidad</p>
              <button onClick={() => setVerPoliticas(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:20, overflowY:'auto', fontSize:13, lineHeight:1.6, color:'#475569' }}>
              <p><strong>1. Uso de Datos:</strong> ViñaMed utiliza sus datos personales exclusivamente para fines de atención de salud, agendamiento y entrega de resultados clínicos.</p>
              <p><strong>2. Seguridad:</strong> Aplicamos estándares de cifrado TLS y control de acceso restringido conforme a la Ley 19.628 sobre Protección de la Vida Privada.</p>
              <p><strong>3. Derechos:</strong> Usted tiene derecho de acceso, rectificación y cancelación de sus datos personales en cualquier momento.</p>
              <p><strong>4. Almacenamiento:</strong> Los registros clínicos se mantienen por el tiempo legal estipulado por el MINSAL.</p>
            </div>
            <div style={{ padding:16, borderTop:'1px solid #eee', textAlign:'right' }}>
              <button onClick={() => setVerPoliticas(false)} style={{ padding:'8px 20px', borderRadius:10, border:'none', background:'#0E7490', color:'#fff', fontWeight:600, cursor:'pointer' }}>Entendido</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Consentimiento */}
      {verConsent && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:20, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ margin:0, fontWeight:700, color:'#0f172a' }}>Consentimiento Informado</p>
              <button onClick={() => setVerConsent(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            <div style={{ padding:20, overflowY:'auto', fontSize:13, lineHeight:1.6, color:'#475569' }}>
              <p>Al aceptar este consentimiento, usted declara comprender y autorizar:</p>
              <ul>
                <li>El uso de la plataforma digital para la visualización de sus exámenes médicos.</li>
                <li>La recepción de notificaciones vía correo electrónico y/o SMS.</li>
                <li>La modalidad de telemedicina si corresponde a su atención, aceptando las limitaciones técnicas del medio digital.</li>
                <li>La veracidad de los datos entregados en este registro.</li>
              </ul>
              <p>Este consentimiento puede ser revocado mediante solicitud formal en el centro médico.</p>
            </div>
            <div style={{ padding:16, borderTop:'1px solid #eee', textAlign:'right' }}>
              <button onClick={() => setVerConsent(false)} style={{ padding:'8px 20px', borderRadius:10, border:'none', background:'#0E7490', color:'#fff', fontWeight:600, cursor:'pointer' }}>Entendido</button>
            </div>
          </div>
        </div>
      )}

      {errorGral && (
        <div style={{
          background:'rgba(239,68,68,0.12)',
          border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:10, padding:'10px 14px', marginTop:12,
          fontSize:12, color:'rgba(239,68,68,0.9)',
        }}>
          {errorGral}
        </div>
      )}
    </>
  );
}
