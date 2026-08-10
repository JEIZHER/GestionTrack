import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import MapView from './components/MapView';
import StatusCard from './components/StatusCard';
import { AlertCircle, CheckCircle, PackageX } from 'lucide-react';

export default function App() {
  const [params, setParams] = useState({ movil: '', token: '' });
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('PENDIENTE');
  const [speed, setSpeed] = useState(0);
  const [lastSeen, setLastSeen] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [msgCount, setMsgCount] = useState(0);
  const channelRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const movil = searchParams.get('movil') || searchParams.get('m') || '';
    const token = searchParams.get('t') || searchParams.get('of') || '';

    console.log('📦 [GestionTrack] Params leídos:', { movil, token });

    if (!movil || !token) {
      setErrorMsg('El enlace de seguimiento es inválido o faltan parámetros.');
      return;
    }

    setParams({ movil, token });

    const channelName = `movil-${movil}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        if (!payload) return;

        setMsgCount(c => c + 1);

        const ofStatus = payload.ofs ? payload.ofs[token] : null;

        if (ofStatus) {
          setStatus(ofStatus);
        }

        if (payload.coords) {
          setCoords({ ...payload.coords });
          setSpeed(payload.coords.speed || 0);
        }

        const ts = payload.timestamp ? new Date(payload.timestamp) : new Date();
        setLastSeen(ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        if (ofStatus === 'ENTREGADO' || ofStatus === 'RECHAZADO') {
          console.log('🏁 [GestionTrack] OF finalizada, desconectando canal');
          channel.unsubscribe();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (errorMsg) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a',
        color: '#f8fafc', padding: '2rem', textAlign: 'center'
      }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Enlace Inválido</h2>
        <p style={{ color: '#94a3b8', maxWidth: '360px', fontSize: '0.9rem' }}>{errorMsg}</p>
      </div>
    );
  }

  // --- VISTA PANTALLA COMPLETA DE ENTREGADO / FINALIZADO ---
  const isFinalState = status === 'ENTREGADO' || status === 'RECHAZADO' || status === 'DEVUELTO';

  if (isFinalState) {
    const isSuccess = status === 'ENTREGADO';
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <Header movil={params.movil} ofToken={params.token} />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          maxWidth: '480px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Card Premium de Estado Finalizado */}
          <div style={{
            backgroundColor: '#1e293b',
            border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
            borderRadius: '24px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            boxSizing: 'border-box',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '50%',
              backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isSuccess ? '#10b981' : '#ef4444',
              marginBottom: '1.5rem'
            }}>
              {isSuccess ? <CheckCircle size={48} /> : <PackageX size={48} />}
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0 0 0.75rem 0',
              letterSpacing: '-0.025em'
            }}>
              {isSuccess ? '¡Pedido Entregado!' : 'Pedido Devuelto'}
            </h2>

            <p style={{
              fontSize: '0.95rem',
              color: '#94a3b8',
              lineHeight: '1.6',
              margin: '0 0 1.5rem 0'
            }}>
              {isSuccess
                ? 'El repartidor ha completado la entrega de tu pedido exitosamente. ¡Muchas gracias por tu preferencia!'
                : `La orden de flete no pudo ser completada. Estado registrado: ${status}.`}
            </p>

            <div style={{
              borderTop: '1px solid #334155',
              paddingTop: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              <div>Orden de Flete: <strong style={{ color: '#f8fafc' }}>{params.token}</strong></div>
              <div>Móvil Asociado: <strong style={{ color: '#f8fafc' }}>{params.movil}</strong></div>
            </div>
          </div>

          {/* Espacio Publicitario / Sponsor Slot */}
          <div style={{
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px dashed #475569',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Publicidad / Novedades
            </span>
            <div style={{
              height: '80px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontSize: '0.85rem',
              fontStyle: 'italic'
            }}>
              Espacio disponible para promociones
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA ACTIVA CON MAPA (EN_RUTA / PENDIENTE) ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Header movil={params.movil} ofToken={params.token} />

      {/* Badge de diagnóstico discreto en bottom left */}
      <div style={{
        position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid #334155', borderRadius: 8, padding: '6px 10px',
        color: '#64748b', fontSize: '0.6rem', fontFamily: 'monospace'
      }}>
        <span>c: {msgCount} | s: {status}</span>
      </div>

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapView coords={coords} movil={params.movil} />
        <StatusCard status={status} speed={speed} lastSeen={lastSeen} />
      </main>
    </div>
  );
}
