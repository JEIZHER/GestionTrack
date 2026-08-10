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
  const [isStale, setIsStale] = useState(false);
  const channelRef = useRef(null);
  const staleTimerRef = useRef(null);

  const resetStaleTimer = () => {
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
    }
    setIsStale(false);
    staleTimerRef.current = setTimeout(() => {
      setIsStale(true);
    }, 20000); // 20 segundos
  };

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
        resetStaleTimer();

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
          if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
          channel.unsubscribe();
        }
      })
      .subscribe();

    return () => {
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
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
    const ofDisplay = params.token ? params.token.split('_')[0] : '';
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflowY: 'auto'
      }}>
        <Header movil={params.movil} ofToken={params.token} />

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem 1rem',
          maxWidth: '440px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          gap: '0.75rem'
        }}>
          {/* Card Estado */}
          <div style={{
            backgroundColor: '#1e293b',
            border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
            borderRadius: '20px',
            padding: '1.75rem 1.25rem',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '50%',
              backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isSuccess ? '#10b981' : '#ef4444',
              marginBottom: '1rem'
            }}>
              {isSuccess ? <CheckCircle size={40} /> : <PackageX size={40} />}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
              {isSuccess ? '¡Pedido Entregado!' : 'Pedido Devuelto'}
            </h2>

            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1.1rem 0', lineHeight: '1.5' }}>
              {isSuccess ? '¡Gracias por su preferencia!' : `Estado: ${status}`}
            </p>

            <div style={{
              borderTop: '1px solid #334155',
              paddingTop: '0.85rem',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#64748b'
            }}>
              <span>OF: <strong style={{ color: '#f8fafc' }}>{ofDisplay}</strong></span>
              <span>Móvil: <strong style={{ color: '#f8fafc' }}>{params.movil}</strong></span>
            </div>
          </div>

          {/* Slot Publicitario */}
          <div style={{
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px dashed #475569',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Publicidad / Novedades
            </div>
            <div style={{
              height: '60px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              fontSize: '0.8rem',
              fontStyle: 'italic'
            }}>
              Espacio disponible
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
        <StatusCard status={status} speed={speed} lastSeen={lastSeen} isStale={isStale} />
      </main>
    </div>
  );
}
