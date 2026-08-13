import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Target } from 'lucide-react';
import DriverIcon from '../assets/icon.png';

// Icono personalizado para el vehículo usando el branding de GestionSTK
const vehicleIcon = L.icon({
  iconUrl: DriverIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'vehicle-marker-icon'
});

function MapController({ coords }) {
  const map = useMap();
  const hasInitialCentered = useRef(false);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  // Centrar automáticamente solo la primera vez que se reciben coordenadas
  useEffect(() => {
    if (coords && coords.lat && coords.lng && !hasInitialCentered.current) {
      map.setView([coords.lat, coords.lng], 15);
      hasInitialCentered.current = true;
    }
  }, [coords, map]);

  // Escuchar doble clic / doble tap en el mapa para recentrar en el vehículo
  useMapEvents({
    dblclick: () => {
      const currentCoords = coordsRef.current;
      if (currentCoords && currentCoords.lat && currentCoords.lng) {
        map.panTo([currentCoords.lat, currentCoords.lng], { animate: true });
      }
    }
  });

  return null;
}

export default function MapView({ coords, movil }) {
  const mapRef = useRef(null);
  const defaultPos = coords && coords.lat ? [coords.lat, coords.lng] : [-34.1701, -70.7408];

  const handleRecenter = () => {
    if (mapRef.current && coords && coords.lat && coords.lng) {
      mapRef.current.panTo([coords.lat, coords.lng], { animate: true });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultPos}
        zoom={14}
        zoomControl={false}
        doubleClickZoom={false}
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {coords && coords.lat && (
          <>
            <Marker position={[coords.lat, coords.lng]} icon={vehicleIcon}>
              <Popup>
                <strong>Repartidor ({movil || 'Móvil'})</strong><br />
                En trayecto de entrega
              </Popup>
            </Marker>
            <MapController coords={coords} />
          </>
        )}
      </MapContainer>

      {/* Botón flotante para recentrar manualmente */}
      {coords && coords.lat && (
        <button
          onClick={handleRecenter}
          title="Doble clic en el mapa o pulsa aquí para centrar en el repartidor"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease, backgroundColor 0.2s ease'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Target size={22} />
        </button>
      )}
    </div>
  );
}
