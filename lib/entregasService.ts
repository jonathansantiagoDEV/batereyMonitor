import { supabase } from './supabaseClient';

export async function criarEntrega(entrega:any){
 return supabase.from('entregas').insert(entrega).select().single();
}

export async function atualizarStatusEntrega(id:string,status:string){
 return supabase.from('entregas').update({status}).eq('id',id);
}

export async function listarEntregas(){
 return supabase.from('entregas').select('*').order('created_at',{ascending:false});
}
