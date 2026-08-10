import React from 'react';
import { ShieldCheck } from 'lucide-react';
import BoxIcon from '../assets/Box.png';

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
          padding: '0.4rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={BoxIcon} alt="Box" style={{ width: 26, height: 26, objectFit: 'contain' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.01em' }}>
            Gestion Track
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
