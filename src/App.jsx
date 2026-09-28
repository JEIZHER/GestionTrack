import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import MapView from './components/MapView';
import StatusCard from './components/StatusCard';
import { AlertCircle, CheckCircle, PackageX } from 'lucide-react';

// Helper para verificar si la OF (token) está presente en las pendientes del móvil
function checkIsOfPending(ofsPendientes, token) {
  if (!Array.isArray(ofsPendientes)) return false;
  if (!token) return ofsPendientes.length > 0;

  const cleanToken = String(token).trim().toLowerCase();
  const tokenBase = cleanToken.split('_')[0];

  return ofsPendientes.some(item => {
    if (!item) return false;

    if (typeof item === 'string') {
      const cleanItem = item.trim().toLowerCase();
      const itemBase = cleanItem.split('_')[0];
      return cleanItem === cleanToken || itemBase === tokenBase || cleanToken.startsWith(cleanItem);
    }

    if (typeof item === 'object') {
      const itemToken = String(item.token || '').trim().toLowerCase();
      const itemOf = String(item.of || item.orden_flete || '').trim().toLowerCase();

      return (
        (itemToken && itemToken === cleanToken) ||
        (itemOf && itemOf === cleanToken) ||
        (itemOf && itemOf === tokenBase) ||
        (cleanToken && itemOf && cleanToken.startsWith(itemOf))
      );
    }

    return false;
  });
}

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

    const handleRowUpdate = (row) => {
      if (!row) return;

      setMsgCount(c => c + 1);

      const lat = parseFloat(row.lat);
      const lng = parseFloat(row.lng);
      const ofsPendientes = row.ofs_pendientes || [];

      // Actualizar coordenadas solo si son válidas y distintas de 0.0 (posición limpia)
      if (lat && lng && (lat !== 0 || lng !== 0)) {
        setCoords({ lat, lng });
        setSpeed(row.speed || 0);
      } else {
        setCoords(null);
      }

      const ts = row.updated_at ? new Date(row.updated_at) : new Date();
      setLastSeen(ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Verificar si la OF requerida sigue pendiente para este móvil
      const isPending = checkIsOfPending(ofsPendientes, token);

      if (isPending) {
        setStatus('EN_RUTA');
      } else {
        console.log('🏁 [GestionTrack] La OF ya no está en pendientes -> ENTREGADO');
        setStatus('ENTREGADO');
      }
    };

    // 1. Consulta inicial a la tabla posiciones_usuarios
    const fetchInitialPosition = async () => {
      try {
        const { data, error } = await supabase
          .from('posiciones_usuarios')
          .select('*')
          .or(`movil_id.eq.${movil},movil_id.ilike.%${movil}%`)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('⚠️ [GestionTrack] Error al consultar posiciones_usuarios:', error);
          setErrorMsg('Error al consultar el servicio de seguimiento.');
          return;
        }

        if (!data) {
          console.warn('⚠️ [GestionTrack] Móvil no encontrado en posiciones_usuarios:', movil);
          setErrorMsg(`No hay información de seguimiento activa para el móvil ${movil}.`);
          return;
        }

        handleRowUpdate(data);
      } catch (err) {
        console.error('❌ [GestionTrack] Excepción consultando posición:', err);
      }
    };

    fetchInitialPosition();

    // 2. Suscripción en tiempo real (Realtime Postgres Changes)
    const channel = supabase
      .channel(`posiciones_usuarios_${movil}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posiciones_usuarios',
          filter: `movil_id=eq.${movil}`,
        },
        (payload) => {
          console.log('⚡ [GestionTrack] Realtime postgres_changes:', payload);
          if (payload.new) {
            handleRowUpdate(payload.new);
          }
        }
      )
      .subscribe((subStatus) => {
        console.log('📡 [GestionTrack] Estado suscripción Realtime:', subStatus);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
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
        <StatusCard status={status} speed={speed} lastSeen={lastSeen} />
      </main>
    </div>
  );
}
