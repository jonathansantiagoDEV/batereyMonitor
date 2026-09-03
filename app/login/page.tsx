'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  async function entrar() {

    setErro('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });


    if(error){
      setErro('Email ou senha inválidos');
      return;
    }


    const usuario = data.user;


    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', usuario.id)
      .single();


    if(perfil?.role === 'ADMIN'){

      router.push('/chefe');

    }else{

      router.push('/entregador');

    }

  }


  return (

    <main style={{
      minHeight:'100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center'
    }}>


      <div style={{
        width:350,
        display:'flex',
        flexDirection:'column',
        gap:15
      }}>


        <h1>
          Esquinas Delivery
        </h1>


        <input
          placeholder="Email"
          value={email}
          onChange={
            e=>setEmail(e.target.value)
          }
        />


        <input
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={
            e=>setSenha(e.target.value)
          }
        />


        <button onClick={entrar}>
          Entrar
        </button>


        {
          erro &&
          <p style={{color:'red'}}>
            {erro}
          </p>
        }


      </div>

    </main>

  );
}