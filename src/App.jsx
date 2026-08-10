import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Header from './components/Header';
import MapView from './components/MapView';
import StatusCard from './components/StatusCard';
import { PackageSearch, AlertCircle } from 'lucide-react';

export default function App() {
  const [params, setParams] = useState({ movil: '', token: '' });
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('PENDIENTE'); // PENDIENTE | EN_RUTA | ENTREGADO | RECHAZADO
  const [speed, setSpeed] = useState(0);
  const [lastSeen, setLastSeen] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 1. Leer parámetros de la URL: ?movil=60900&t=a8f9c3b2e1
    const searchParams = new URLSearchParams(window.location.search);
    const movil = searchParams.get('movil') || searchParams.get('m') || '';
    const token = searchParams.get('t') || searchParams.get('of') || '';

    if (!movil || !token) {
      setErrorMsg('El enlace de seguimiento es inválido o faltan parámetros.');
      return;
    }

    setParams({ movil, token });

    // 2. Suscribirse al canal Broadcast del móvil
    const channelName = `movil-${movil}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }
      }
    });

    channel
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        if (!payload) return;

        // Payload esperado: { coords: { lat, lng, speed }, ofs: { "token": "EN_RUTA" }, timestamp }
        const ofStatus = payload.ofs ? payload.ofs[token] : null;

        if (ofStatus) {
          setStatus(ofStatus);
        }

        if (payload.coords) {
          setCoords(payload.coords);
          setSpeed(payload.coords.speed || 0);
        }

        if (payload.timestamp) {
          const date = new Date(payload.timestamp);
          setLastSeen(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } else {
          setLastSeen(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        // Si la entrega ya fue finalizada, nos desconectamos de Broadcast
        if (ofStatus === 'ENTREGADO' || ofStatus === 'RECHAZADO') {
          channel.unsubscribe();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Conectado exitosamente al canal: ${channelName}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (errorMsg) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Enlace Inválido</h2>
        <p style={{ color: '#94a3b8', maxWidth: '360px', fontSize: '0.9rem' }}>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Header movil={params.movil} ofToken={params.token} />

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapView coords={coords} movil={params.movil} />
        <StatusCard status={status} speed={speed} lastSeen={lastSeen} />
      </main>
    </div>
  );
}
