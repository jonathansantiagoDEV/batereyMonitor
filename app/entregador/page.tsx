'use client';
import {useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

const supabase=createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EntregadorPage(){
 const [pos,setPos]=useState<any>(null);
 const [status,setStatus]=useState('AGUARDANDO');

 useEffect(()=>{
  const id=navigator.geolocation?.watchPosition(async p=>{
   const local={latitude:p.coords.latitude,longitude:p.coords.longitude};
   setPos(local);
   await supabase.from('localizacoes').insert(local);
  },()=>{}, {enableHighAccuracy:true});

  return ()=> id && navigator.geolocation.clearWatch(id);
 },[]);

 return <main className='p-6'>
  <h1 className='text-2xl font-bold'>Entregador</h1>
  <p>Status: {status}</p>
  <button className='bg-green-600 text-white p-3 rounded' onClick={()=>setStatus('EM_ROTA')}>
   Iniciar rota
  </button>
  {pos && <p>{pos.latitude} / {pos.longitude}</p>}
 </main>
}
