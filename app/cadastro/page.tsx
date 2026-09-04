'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

  function validar() {
    if (!nome.trim()) return 'Informe seu nome';
    if (!email.trim()) return 'Informe seu email';
    if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres';
    if (senha !== confirmarSenha) return 'As senhas não coincidem';
    return '';
  }

  async function cadastrar() {
    setErro('');
    setSucesso('');

    const mensagemValidacao = validar();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setCadastrando(true);

    // O trigger handle_new_user() (supabase/profiles.sql) cria o perfil
    // automaticamente assim que o usuário é inserido em auth.users, com
    // role = 'ENTREGADOR' (usuário comum) por padrão — ou seja, todo mundo
    // que se cadastra por aqui já nasce como usuário comum. O único ADMIN
    // é o que já existe direto no banco.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErro(traduzErro(error.message));
      setCadastrando(false);
      return;
    }

    // Se o projeto Supabase exige confirmação por email, "session" vem nula
    // aqui e o usuário só consegue logar depois de clicar no link do email.
    if (!data.session) {
      setSucesso('Cadastro realizado! Verifique seu email para confirmar a conta antes de entrar.');
      setCadastrando(false);
      return;
    }

    // Confirmação por email desligada no projeto: já cai logado.
    router.push('/entregador');
  }

  function traduzErro(mensagem: string) {
    if (mensagem.toLowerCase().includes('already registered')) {
      return 'Este email já está cadastrado';
    }
    return 'Não foi possível concluir o cadastro. Tente novamente.';
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !cadastrando) cadastrar();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm flex flex-col gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Criar conta</h1>

        <input
          className="border rounded p-2"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={aoTeclar}
        />

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

        <input
          className="border rounded p-2"
          placeholder="Confirmar senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          onKeyDown={aoTeclar}
        />

        <button
          className="bg-blue-600 text-white p-3 rounded disabled:opacity-50"
          onClick={cadastrar}
          disabled={cadastrando}
        >
          {cadastrando ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        {erro && <p className="text-red-600 text-sm text-center">{erro}</p>}
        {sucesso && <p className="text-green-600 text-sm text-center">{sucesso}</p>}

        <p className="text-sm text-center text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
