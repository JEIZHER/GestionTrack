import React from 'react';
import { Truck, ShieldCheck } from 'lucide-react';

export default function Header({ movil, ofToken }) {
  return (
    <header style={{
      padding: '0.85rem 1.25rem',
      backgroundColor: '#1e293b',
      borderBottom: '1px solid #334155',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          backgroundColor: '#10b981',
          color: '#000',
          padding: '0.5rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Truck size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.01em' }}>
            GestionSTK Track
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
            {movil ? `Móvil asignado: ${movil}` : 'Seguimiento en vivo'}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: '#0f172a',
        padding: '0.4rem 0.75rem',
        borderRadius: '20px',
        border: '1px solid #334155',
        fontSize: '0.75rem',
        color: '#10b981',
        fontWeight: 600
      }}>
        <ShieldCheck size={14} />
        <span>Conexión Segura</span>
      </div>
    </header>
  );
}
