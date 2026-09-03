'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

const supabase=createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Chefe(){
 const [loc,setLoc]=useState<any[]>([]);
 useEffect(()=>{
  const c=supabase.channel('localizacoes')
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'localizacoes'},p=>{
    setLoc(v=>[p.new,...v]);
   }).subscribe();
  return ()=>{supabase.removeChannel(c)}
 },[]);
 return <main className='p-6'>
 <h1 className='text-2xl font-bold'>Dashboard Chefe</h1>
 {loc.map((l:any)=><div key={l.id}>📍 {l.latitude} {l.longitude}</div>)}
 </main>
}
