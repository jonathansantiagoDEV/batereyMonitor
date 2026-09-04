'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type EntregadorPosicao = {
  entregador_id: string;
  nome: string | null;
  latitude: number;
  longitude: number;
  created_at?: string;
};

// Corrige os ícones padrão do Leaflet, que quebram com o bundler do Next.js.
function useFixLeafletIcons() {
  useEffect(() => {
    // @ts-expect-error - propriedade interna do Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);
}

const CENTRO_PADRAO: [number, number] = [-23.5505, -46.6333]; // São Paulo, só de fallback

export default function MapaEntregadores({
  entregadores = [],
}: {
  entregadores: EntregadorPosicao[];
}) {
  useFixLeafletIcons();

  const centro: [number, number] = entregadores[0]
    ? [entregadores[0].latitude, entregadores[0].longitude]
    : CENTRO_PADRAO;

  return (
    <MapContainer
      center={centro}
      zoom={13}
      scrollWheelZoom
      style={{ height: '500px', width: '100%', borderRadius: 8 }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {entregadores.map((e) => (
        <Marker key={e.entregador_id} position={[e.latitude, e.longitude]}>
          <Popup>
            <strong>{e.nome || 'Entregador'}</strong>
            <br />
            {e.created_at && (
              <span>Atualizado: {new Date(e.created_at).toLocaleTimeString()}</span>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
