import { supabase } from './supabaseClient';

export async function registrarLocalizacao(
  entregador_id: string,
  latitude: number,
  longitude: number,
  velocidade: number | null = null
) {
  return supabase
    .from('localizacoes')
    .insert({ entregador_id, latitude, longitude, velocidade });
}

// Última posição conhecida de cada entregador (view respeita RLS:
// ADMIN vê todos, entregador comum só veria a própria linha).
export async function listarUltimasLocalizacoes() {
  return supabase
    .from('ultimas_localizacoes')
    .select('entregador_id, nome, latitude, longitude, velocidade, created_at');
}