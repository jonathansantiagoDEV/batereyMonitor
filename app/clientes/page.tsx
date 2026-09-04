'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listarClientes } from '@/lib/clientesService';

type Cliente = {
  id: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
  created_at: string;
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarClientes().then(({ data, error }) => {
      if (error) setErro(error.message);
      else setClientes(data || []);
      setCarregando(false);
    });
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Link href="/clientes/novo" className="bg-blue-600 text-white px-4 py-2 rounded">
          Novo cliente
        </Link>
      </div>

      {carregando && <p className="text-gray-500">Carregando...</p>}
      {erro && <p className="text-red-600">{erro}</p>}
      {!carregando && !erro && clientes.length === 0 && (
        <p className="text-gray-500">Nenhum cliente cadastrado ainda.</p>
      )}

      <ul className="space-y-2">
        {clientes.map((c) => (
          <li key={c.id} className="border rounded p-3">
            <p className="font-medium">{c.nome}</p>
            <p className="text-sm text-gray-600">{c.telefone || 'Sem telefone'}</p>
            <p className="text-sm text-gray-600">{c.endereco || 'Sem endereço'}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
