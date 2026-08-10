import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Icono personalizado para el vehículo
const truckIcon = L.divIcon({
  className: 'truck-marker-icon',
  html: `<div class="truck-pulse">🚚</div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.setView([coords.lat, coords.lng], 15, { animate: true });
    }
  }, [coords, map]);
  return null;
}

export default function MapView({ coords, movil }) {
  // Coordenadas por defecto (Rancagua / Chile como fallback neutral)
  const defaultPos = coords && coords.lat ? [coords.lat, coords.lng] : [-34.1701, -70.7408];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultPos}
        zoom={14}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {coords && coords.lat && (
          <>
            <Marker position={[coords.lat, coords.lng]} icon={truckIcon}>
              <Popup>
                <strong>Repartidor ({movil || 'Móvil'})</strong><br />
                En trayecto de entrega
              </Popup>
            </Marker>
            <RecenterMap coords={coords} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
