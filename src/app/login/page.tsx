'use client';

import { useState } from 'react';
import { loginConEmail } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorGral, setErrorGral] = useState('');

  const puedeIngresar = email.trim().length >= 3 && password.trim().length >= 1 && !cargando;

  function handleEmailBlur() {
    if (!email.trim()) return;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    setErrorEmail(ok ? '' : 'Correo electrónico inválido');
  }

  async function doLogin() {
    setErrorGral('');

    const emailTrim = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setErrorEmail('Correo electrónico inválido');
      return;
    }
    if (!password.trim()) {
      setErrorGral('Ingresa tu contraseña.');
      return;
    }

    setCargando(true);
    try {
      const user = await loginConEmail(emailTrim, password);
      localStorage.setItem('paciente_uid', user.uid);
      window.location.href = '/portal';
    } catch (e: any) {
      setErrorGral(e?.message || 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        background: 'linear-gradient(145deg,#0C4A6E,#0E7490,#0F766E)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingTop: 'calc(24px + env(safe-area-inset-top))'
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M2 18 Q6 6 18 18 Q22 22 28 10" stroke="#5DCAA5" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path
            d="M8 18h4l3-6 4 12 3-6h4"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 500, color: '#fff', fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>
          Mi Salud
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 16 }}>
          Portal de pacientes · ViñaMed
        </div>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(14,116,144,0.25)',
          border: '1px solid rgba(14,116,144,0.4)',
          borderRadius: 20,
          padding: '4px 12px',
          marginBottom: 22
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5DCAA5', flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: '#5DCAA5', letterSpacing: '0.04em' }}>Conexión segura · vinamed.cl</span>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 20,
          padding: '22px 18px',
          width: '100%',
          maxWidth: 380
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <input
          value={email}
            onChange={(e) => {
            setEmail(e.target.value);
            setErrorEmail('');
            }}
          onBlur={handleEmailBlur}
          placeholder="tucorreo@dominio.cl"
          type="email"
          inputMode="email"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                padding: '13px 16px',
                fontSize: 16,
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                WebkitAppearance: 'none'
              }}
          />
          {errorEmail && (
            <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.85)', margin: '4px 0 0' }}>{errorEmail}</p>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={verPass ? 'text' : 'password'}
            placeholder="Contraseña"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '13px 44px 13px 16px',
              fontSize: 16,
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
              WebkitAppearance: 'none'
            }}
          />
          <button
            type="button"
            onClick={() => setVerPass((v) => !v)}
            aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {!verPass ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.2"
                  fill="none"
                />
                <circle cx="8" cy="8" r="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" fill="none" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2l12 12M6.5 6.6A2 2 0 009.4 9.5"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 4.9C2.5 6 1 8 1 8s3 5 7 5c1.4 0 2.7-.5 3.8-1.2M7 3.1C7.3 3 7.7 3 8 3c4 0 7 5 7 5s-.8 1.4-2 2.6"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={doLogin}
          disabled={!puedeIngresar}
          style={{
            width: '100%',
            padding: '14px 0',
            background: puedeIngresar ? '#fff' : 'rgba(255,255,255,0.5)',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: '#0C4A6E',
            cursor: puedeIngresar ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 12,
            opacity: cargando ? 0.85 : 1
          }}
        >
          <span>{cargando ? 'Ingresando...' : 'Ingresar a mi portal'}</span>
          {cargando && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="7" cy="7" r="5.5" stroke="#0C4A6E" strokeWidth="1.5" strokeDasharray="20 15" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {errorGral && (
          <div
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 12,
              color: 'rgba(239,68,68,0.92)',
              lineHeight: 1.6,
              marginBottom: 12
            }}
          >
            {errorGral}
          </div>
        )}

        <p style={{ textAlign: 'center', margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          ¿No tienes cuenta?{' '}
          <a href="/registro" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>
            Regístrate
          </a>
        </p>

        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 18, letterSpacing: '0.03em', lineHeight: 1.6 }}>
          Al ingresar aceptas nuestra Política de Privacidad · Ley N° 20.584
        </p>

        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <img src="/logo3.png" alt="Synaptech Spa" style={{ height: 14, objectFit: 'contain', opacity: 0.3 }} />
          Desarrollado por Synaptech Spa
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

