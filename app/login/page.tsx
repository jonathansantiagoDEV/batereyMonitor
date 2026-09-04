'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setErro('');
    setEntrando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro('Email ou senha inválidos');
      setEntrando(false);
      return;
    }

    const usuario = data.user;

    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', usuario.id)
      .single();

    if (perfil?.role === 'ADMIN') {
      router.push('/chefe');
    } else {
      router.push('/entregador');
    }
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !entrando) entrar();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm flex flex-col gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Esquinas Delivery</h1>

        <input
          className="border rounded p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={aoTeclar}
        />

        <input
          className="border rounded p-2"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={aoTeclar}
        />

        <button
          className="bg-blue-600 text-white p-3 rounded disabled:opacity-50"
          onClick={entrar}
          disabled={entrando}
        >
          {entrando ? 'Entrando...' : 'Entrar'}
        </button>

        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}
      </div>
    </main>
  );
}