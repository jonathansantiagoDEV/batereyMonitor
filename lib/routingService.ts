// Geocodificação (endereço -> coordenadas) via Nominatim (OpenStreetMap) e
// cálculo de rota real pelas ruas via OSRM — ambas APIs públicas e
// gratuitas, sem necessidade de chave de API. Usadas pelo simulador de
// entregador (components/SimuladorEntregador.tsx) para não depender de um
// entregador de verdade em campo durante os testes.

export type Coordenada = { lat: number; lon: number };

export async function geocodificarEndereco(endereco: string): Promise<Coordenada | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
    endereco
  )}`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'pt-BR' },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// Distância em metros entre dois pontos (fórmula de Haversine).
export function distanciaMetros(a: Coordenada, b: Coordenada) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Rota real pelas ruas entre dois pontos, usando o servidor demo público do
// OSRM. Retorna os pontos da geometria da rota (bem mais densos que só
// origem/destino, o que dá pra animação um movimento suave seguindo as ruas).
export async function obterRota(origem: Coordenada, destino: Coordenada): Promise<Coordenada[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origem.lon},${origem.lat};${destino.lon},${destino.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Não foi possível calcular a rota.');

  const data = await res.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error('Nenhuma rota encontrada entre os dois endereços.');
  }

  const coordenadas: [number, number][] = data.routes[0].geometry.coordinates;
  return coordenadas.map(([lon, lat]) => ({ lat, lon }));
}
