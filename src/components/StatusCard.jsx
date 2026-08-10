import React from 'react';
import { CheckCircle2, Clock, Navigation, AlertTriangle, PackageX } from 'lucide-react';

export default function StatusCard({ status, speed, lastSeen, isStale }) {
  if (status === 'ENTREGADO') {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
          <CheckCircle2 size={32} />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              ¡Pedido Entregado!
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              Tu entrega ha sido completada exitosamente. Gracias por tu preferencia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'RECHAZADO' || status === 'DEVUELTO') {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
          <PackageX size={32} />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Entrega No Completada
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              El estado actual de tu orden es: <strong>{status}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'EN_RUTA') {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isStale ? '#ef4444' : '#3b82f6' }}>
            {isStale ? (
              <>
                <AlertTriangle size={20} className="animate-pulse" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Última posición conocida</span>
              </>
            ) : (
              <>
                <Navigation size={20} className="animate-pulse" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Repartidor en Camino</span>
              </>
            )}
          </div>
          <span style={{
            backgroundColor: isStale ? '#991b1b' : '#1e3a8a',
            color: isStale ? '#fecaca' : '#93c5fd',
            fontSize: '0.7rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '12px',
            fontWeight: 700
          }}>
            {isStale ? 'SIN SEÑAL' : 'EN VIVO'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #334155' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Velocidad Aprox.</span>
            <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{speed ? `${Math.round(speed)} km/h` : 'En trayecto'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Última señal</span>
            <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>{lastSeen || 'Reciente'}</strong>
          </div>
        </div>
      </div>
    );
  }

  // Estado PENDIENTE / BUSCANDO
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f59e0b' }}>
        <Clock size={28} />
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Esperando señal del vehículo...
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
            El mapa se actualizará automáticamente apenas el repartidor comience el trayecto.
          </p>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  position: 'absolute',
  bottom: '1.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 2rem)',
  maxWidth: '440px',
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '16px',
  padding: '1rem 1.25rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
  zIndex: 1000
};
