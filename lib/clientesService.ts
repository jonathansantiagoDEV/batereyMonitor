import { supabase } from './supabaseClient';

export async function criarCliente(cliente:any){
  return supabase.from('clientes').insert(cliente).select().single();
}

export async function listarClientes(){
  return supabase.from('clientes').select('*').order('created_at',{ascending:false});
}
