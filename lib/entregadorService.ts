import { supabase } from './supabaseClient';

// Garante que existe uma linha em "entregadores" para o usuário logado
// (usuario_id = auth.uid()), criando se ainda não existir, e devolve o
// id dessa linha — é ESSE id que localizacoes.entregador_id espera.
export async function getOuCriarEntregador(usuarioId: string) {
  const { data: existente, error: erroSelect } = await supabase
    .from('entregadores')
    .select('id, status')
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  if (erroSelect) return { data: null, error: erroSelect };
  if (existente) return { data: existente, error: null };

  const { data: criado, error: erroInsert } = await supabase
    .from('entregadores')
    .insert({ usuario_id: usuarioId, status: 'AGUARDANDO' })
    .select('id, status')
    .single();

  return { data: criado, error: erroInsert };
}

export async function atualizarStatusEntregador(entregadorId: string, status: string) {
  return supabase.from('entregadores').update({ status }).eq('id', entregadorId);
}

// Lista entregadores já cadastrados, com o nome vindo de "profiles"
// (join via a FK entregadores.usuario_id -> profiles.id). Usado pelo ADMIN
// para atribuir um entregador a uma entrega.
export async function listarEntregadores() {
  return supabase
    .from('entregadores')
    .select('id, status, profiles(nome)')
    .order('status', { ascending: true });
}