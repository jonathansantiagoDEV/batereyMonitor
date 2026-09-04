'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [entrandoComGoogle, setEntrandoComGoogle] = useState(false);

  // Se o Supabase redirecionou de volta pra cá com erro (ver
  // app/auth/callback/route.ts), mostra o aviso.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('erro=auth')) {
      setErro('Não foi possível concluir o login com Google. Tente novamente.');
    }
  }, []);

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

  async function entrarComGoogle() {
    setErro('');
    setEntrandoComGoogle(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // window.location.origin se adapta sozinho entre produção e
        // previews da Vercel — não precisa fixar a URL do site.
        redirectTo: `${window.location.origin}/auth/callback`,
        // Sem isso o Google pode pular a tela de escolha de conta e
        // entrar direto com a conta já em cache no navegador.
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setErro('Não foi possível iniciar o login com Google.');
      setEntrandoComGoogle(false);
    }
    // Em caso de sucesso o navegador é redirecionado pro Google, então não
    // precisa desligar o "entrandoComGoogle" aqui — a página vai sair daqui.
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !entrando) entrar();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm flex flex-col gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Esquinas Delivery</h1>

        <button
          type="button"
          onClick={entrarComGoogle}
          disabled={entrandoComGoogle}
          className="flex items-center justify-center gap-2 border rounded p-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          <GoogleIcon className="h-4 w-4" />
          {entrandoComGoogle ? 'Redirecionando...' : 'Continuar com Google'}
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          ou
          <div className="h-px flex-1 bg-gray-200" />
        </div>

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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.44c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.76-2.1-6.7-4.93H1.3v3.1C3.26 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3v-3.1H1.3A11.98 11.98 0 000 12c0 1.93.46 3.76 1.3 5.4l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.6 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.6l4 3.1C6.24 6.87 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}