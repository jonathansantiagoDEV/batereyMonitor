'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, signOut } from '@/lib/auth';
import { getProfile } from '@/lib/profileService';

type Perfil = {
  id: string;
  nome: string | null;
  telefone: string | null;
  role: string;
  ativo: boolean;
};

export default function Perfil() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const usuario = await getUser();
      if (!usuario) {
        setErro('Você precisa estar logado.');
        setCarregando(false);
        return;
      }
      try {
        const dados = await getProfile(usuario.id);
        setPerfil(dados);
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Erro ao carregar perfil.');
      }
      setCarregando(false);
    }
    carregar();
  }, []);

  async function sair() {
    await signOut();
    router.push('/login');
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Perfil do usuário</h1>

      {carregando && <p className="text-gray-500">Carregando...</p>}
      {erro && <p className="text-red-600">{erro}</p>}

      {perfil && (
        <div className="border rounded p-4 space-y-2">
          <p><strong>Nome:</strong> {perfil.nome || 'Não informado'}</p>
          <p><strong>Telefone:</strong> {perfil.telefone || 'Não informado'}</p>
          <p><strong>Perfil:</strong> {perfil.role === 'ADMIN' ? 'Administrador' : 'Entregador'}</p>
          <p><strong>Status:</strong> {perfil.ativo ? 'Ativo' : 'Inativo'}</p>
        </div>
      )}

      <button onClick={sair} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
        Sair
      </button>
    </main>
  );
}
