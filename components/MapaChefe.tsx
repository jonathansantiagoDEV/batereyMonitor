'use client';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
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

// Distância (Haversine) entre dois pontos [lat, lon] do histórico.
function distanciaEntrePontos(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Soma a distância percorrida ao longo de todo o histórico de pontos
// recebido nesta sessão (equivalente ao "trip distance" de apps de corrida).
function distanciaPercorridaMetros(historico: [number, number][]) {
  let total = 0;
  for (let i = 1; i < historico.length; i++) {
    total += distanciaEntrePontos(historico[i - 1], historico[i]);
  }
  return total;
}

function formatarDistancia(metros: number) {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}

// Ângulo (0-360°, 0 = norte) da direção entre dois pontos — usado pra girar
// o ícone do motoboy na direção real do movimento, em vez de deixá-lo sempre
// "olhando" pra cima.
function calcularDirecao(a: [number, number], b: [number, number]) {
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const graus = (Math.atan2(y, x) * 180) / Math.PI;
  return (graus + 360) % 360;
}

// Pega os dois últimos pontos distintos do histórico pra calcular a direção
// (pontos repetidos, quando o entregador está parado, não servem pra isso).
function direcaoAtual(historico: [number, number][] | undefined): number | null {
  if (!historico || historico.length < 2) return null;

  const ultimo = historico[historico.length - 1];
  for (let i = historico.length - 2; i >= 0; i--) {
    const anterior = historico[i];
    if (anterior[0] !== ultimo[0] || anterior[1] !== ultimo[1]) {
      return calcularDirecao(anterior, ultimo);
    }
  }
  return null;
}

// Ícone do entregador como um "pino" com seta de direção — a seta gira pra
// apontar pro rumo real do deslocamento; o círculo muda de cor conforme o
// status (em movimento / parado).
function criarIconeEntregador(direcaoGraus: number | null, emMovimento: boolean) {
  const cor = emMovimento ? '#3b82f6' : '#facc15';
  const brilho = emMovimento ? 'rgba(59, 130, 246, 0.9)' : 'rgba(250, 204, 21, 0.9)';
  const rotacao = direcaoGraus ?? 0;

  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="width: 34px; height: 34px; transform: rotate(${rotacao}deg); transition: transform 0.5s ease-out;">
        <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <polygon points="17,1 11,13 23,13" fill="${cor}" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0 0 4px ${brilho});" />
          <circle cx="17" cy="19" r="9" fill="${cor}" stroke="#ffffff" stroke-width="3" style="filter: drop-shadow(0 0 6px ${brilho});" />
          <circle cx="17" cy="19" r="2.5" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 19],
  });
}

export default function MapaChefe({ entregadores }: { entregadores: EntregadorMapa[] }) {
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  const centroPadrao: [number, number] =
    entregadores.length > 0 && entregadores[0].latitude
      ? [entregadores[0].latitude, entregadores[0].longitude]
      : [-7.11076, -34.87075];

  // Se o entregador selecionado sumir da lista (ex.: parou de transmitir),
  // fecha o card flutuante sozinho.
  useEffect(() => {
    if (selecionadoId && !entregadores.some((e) => e.entregador_id === selecionadoId)) {
      setSelecionadoId(null);
    }
  }, [entregadores, selecionadoId]);

  const selecionado = useMemo(
    () => entregadores.find((e) => e.entregador_id === selecionadoId) || null,
    [entregadores, selecionadoId]
  );

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer center={centroPadrao} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a>'
          url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY}`}
        />

        <AjustarVisaoMapa entregadores={entregadores} />

        {entregadores.map((e) => {
          const emMovimento = !!e.velocidade && e.velocidade > 0.5;
          const direcao = direcaoAtual(e.historico);
          const icone = criarIconeEntregador(direcao, emMovimento);

          return (
            <div key={e.entregador_id}>
              {e.historico && e.historico.length > 1 && (
                <>
                  {/* Rota com efeito neon: 3 traçados sobrepostos — um halo
                      largo e translúcido por baixo, um brilho médio, e um
                      núcleo fino e vibrante por cima — simulando um glow. */}
                  <Polyline
                    positions={e.historico}
                    pathOptions={{
                      color: '#60a5fa',
                      weight: 12,
                      opacity: 0.12,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  <Polyline
                    positions={e.historico}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: 6,
                      opacity: 0.35,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  <Polyline
                    positions={e.historico}
                    pathOptions={{
                      color: '#bfdbfe',
                      weight: 2.5,
                      opacity: 0.95,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </>
              )}

              <Marker
                position={[e.latitude, e.longitude]}
                icon={icone}
                eventHandlers={{
                  click: () => setSelecionadoId(e.entregador_id),
                }}
              />
            </div>
          );
        })}
      </MapContainer>

      {selecionado && (
        <CardFlutuanteEntregador
          entregador={selecionado}
          aoFechar={() => setSelecionadoId(null)}
        />
      )}
    </div>
  );
}

function CardFlutuanteEntregador({
  entregador,
  aoFechar,
}: {
  entregador: EntregadorMapa;
  aoFechar: () => void;
}) {
  const kmh = entregador.velocidade ? (entregador.velocidade * 3.6).toFixed(1) : '0.0';
  const emMovimento = !!entregador.velocidade && entregador.velocidade > 0.5;
  const distancia = distanciaPercorridaMetros(entregador.historico || []);

  return (
    <div
      style={{ zIndex: 1000 }}
      className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl shadow-2xl p-4 text-gray-100"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              emMovimento ? 'bg-blue-500 animate-pulse' : 'bg-yellow-500'
            }`}
          />
          <span className="font-semibold text-white">{entregador.nome || 'Entregador'}</span>
        </div>
        <button
          onClick={aoFechar}
          className="text-gray-400 hover:text-gray-200 text-sm leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-gray-800/70 rounded-lg p-2">
          <p className="text-[11px] text-gray-400 uppercase">Velocidade</p>
          <p className="text-lg font-bold text-blue-400">{kmh} km/h</p>
        </div>
        <div className="bg-gray-800/70 rounded-lg p-2">
          <p className="text-[11px] text-gray-400 uppercase">Distância</p>
          <p className="text-lg font-bold text-green-400">{formatarDistancia(distancia)}</p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-gray-500">
        Distância acumulada desde que o painel foi aberto.
      </p>
    </div>
  );
}
