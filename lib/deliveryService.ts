import { supabase } from './supabaseClient';

export async function listarEntregas(){
  return supabase.from('entregas').select('*');
}

export async function atualizarStatus(id:string,status:string){
  return supabase.from('entregas').update({status}).eq('id',id);
}
