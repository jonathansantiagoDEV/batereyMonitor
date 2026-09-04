import { supabase } from './supabaseClient';

export type Entrega = {
  id: string;
  cliente: string | null;
  endereco: string | null;
  status: string;
  entregador_id: string | null;
  token_rastreio: string | null;
  created_at: string;
};

export async function criarEntrega(entrega: { cliente: string; endereco: string; entregador_id?: string | null }) {
  return supabase.from('entregas').insert(entrega).select().single();
}

export async function atualizarStatusEntrega(id: string, status: string) {
  return supabase.from('entregas').update({ status }).eq('id', id);
}

export async function listarEntregas() {
  return supabase.from('entregas').select('*').order('created_at', { ascending: false });
}

// Entregas atribuídas a um entregador específico (usa o id da linha em
// "entregadores", não o usuario_id — ver lib/entregadorService.ts).
export async function listarEntregasDoEntregador(entregadorId: string) {
  return supabase
    .from('entregas')
    .select('*')
    .eq('entregador_id', entregadorId)
    .order('created_at', { ascending: false });
}
