'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarCliente } from '@/lib/clientesService';

export default function NovoCliente() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim()) {
      setErro('Informe o nome do cliente.');
      return;
    }
    setErro(null);
    setSalvando(true);

    const { error } = await criarCliente({ nome, telefone, endereco });

    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.push('/clientes');
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Novo Cliente</h1>

      <div className="flex flex-col gap-3">
        <input
          className="border rounded p-2"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="Endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white p-3 rounded disabled:opacity-50"
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Salvar cliente'}
        </button>

        {erro && <p className="text-red-600 text-sm">{erro}</p>}
      </div>
    </main>
  );
}
