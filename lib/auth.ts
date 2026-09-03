import { supabase } from './supabaseClient';

export async function signIn(email:string,password:string){
 return supabase.auth.signInWithPassword({email,password});
}

export async function signOut(){
 return supabase.auth.signOut();
}

export async function getUser(){
 const {data}=await supabase.auth.getUser();
 return data.user;
}
