'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { EntregadorMapa } from '@/app/chefe/page';

// Ajusta a visão do mapa para enquadrar todos os entregadores ativos
function AjustarVisaoMapa({ entregadores }: { entregadores: EntregadorMapa[] }) {
  const map = useMap();

  useEffect(() => {
    if (entregadores.length > 0) {
      const pontos = entregadores
        .filter((e) => e.latitude && e.longitude)
        .map((e) => [e.latitude, e.longitude] as [number, number]);

      if (pontos.length > 0) {
        const bounds = L.latLngBounds(pontos);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [entregadores, map]);

  return null;
}

const iconeEntregador = L.divIcon({
  className: 'custom-icon',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #ffffff;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.9);
    ">
      <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function MapaChefe({ entregadores }: { entregadores: EntregadorMapa[] }) {
  const centroPadrao: [number, number] =
    entregadores.length > 0 && entregadores[0].latitude
      ? [entregadores[0].latitude, entregadores[0].longitude]
      : [-7.11076, -34.87075];

  return (
    <MapContainer center={centroPadrao} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
  attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a>'
  url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
/>

      <AjustarVisaoMapa entregadores={entregadores} />

      {entregadores.map((e) => (
        <div key={e.entregador_id}>
          {e.historico && e.historico.length > 1 && (
            <Polyline
              positions={e.historico}
              pathOptions={{
                color: '#3b82f6',
                weight: 4,
                opacity: 0.8,
                dashArray: '6, 6',
                lineCap: 'round',
              }}
            />
          )}

          <Marker position={[e.latitude, e.longitude]} icon={iconeEntregador}>
            <Popup>
              <div className="text-gray-900 font-sans">
                <strong>{e.nome || 'Entregador'}</strong>
                <br />
                Velocidade: {e.velocidade ? (e.velocidade * 3.6).toFixed(1) : 0} km/h
              </div>
            </Popup>
          </Marker>
        </div>
      ))}
    </MapContainer>
  );
}