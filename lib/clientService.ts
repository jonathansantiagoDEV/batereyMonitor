import { supabase } from './supabaseClient';

export async function getClientes(){
 return await supabase.from('clientes').select('*');
}
export async function createCliente(data:any){
 return await supabase.from('clientes').insert(data);
}
