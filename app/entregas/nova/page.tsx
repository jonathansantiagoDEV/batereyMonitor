'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarEntrega } from '@/lib/entregasService';
import { listarEntregadores } from '@/lib/entregadorService';
import EnderecoAutocomplete from '@/components/EnderecoAutocomplete';

type EntregadorOpcao = {
  id: string;
  status: string;
  profiles: { nome: string | null } | { nome: string | null }[] | null;
};

function nomeEntregador(e: EntregadorOpcao) {
  const perfil = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
  return perfil?.nome || 'Entregador sem nome';
}

export default function NovaEntrega() {
  const router = useRouter();
  const [cliente, setCliente] = useState('');
  const [endereco, setEndereco] = useState('');
  const [entregadorId, setEntregadorId] = useState('');
  const [entregadores, setEntregadores] = useState<EntregadorOpcao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarEntregadores().then(({ data }) => {
      if (data) setEntregadores(data as unknown as EntregadorOpcao[]);
    });
  }, []);

  async function salvar() {
    if (!cliente.trim() || !endereco.trim()) {
      setErro('Preencha cliente e endereço.');
      return;
    }
    setErro(null);
    setSalvando(true);

    const { error } = await criarEntrega({
      cliente,
      endereco,
      entregador_id: entregadorId || null,
    });

    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.push('/entregas');
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nova Entrega</h1>

      <div className="flex flex-col gap-3">
        <input
          className="border rounded p-2"
          placeholder="Cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
        <EnderecoAutocomplete
          className="border rounded p-2 w-full"
          placeholder="Endereço"
          value={endereco}
          onChange={setEndereco}
        />

        <select
          className="border rounded p-2"
          value={entregadorId}
          onChange={(e) => setEntregadorId(e.target.value)}
        >
          <option value="">Sem entregador atribuído (atribuir depois)</option>
          {entregadores.map((ent) => (
            <option key={ent.id} value={ent.id}>
              {nomeEntregador(ent)} — {ent.status}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-600 text-white p-3 rounded disabled:opacity-50"
          onClick={salvar}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : 'Salvar entrega'}
        </button>

        {erro && <p className="text-red-600 text-sm">{erro}</p>}
      </div>
    </main>
  );
}
