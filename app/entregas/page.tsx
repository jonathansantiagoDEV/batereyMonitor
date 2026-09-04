'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listarEntregas, type Entrega } from '@/lib/entregasService';

const CORES_STATUS: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  EM_ROTA: 'bg-blue-100 text-blue-800',
  ENTREGUE: 'bg-green-100 text-green-800',
};

export default function Entregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarEntregas().then(({ data, error }) => {
      if (error) setErro(error.message);
      else setEntregas(data || []);
      setCarregando(false);
    });
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Entregas</h1>
        <Link href="/entregas/nova" className="bg-blue-600 text-white px-4 py-2 rounded">
          Nova entrega
        </Link>
      </div>

      {carregando && <p className="text-gray-500">Carregando...</p>}
      {erro && <p className="text-red-600">{erro}</p>}
      {!carregando && !erro && entregas.length === 0 && (
        <p className="text-gray-500">Nenhuma entrega cadastrada ainda.</p>
      )}

      <ul className="space-y-2">
        {entregas.map((e) => (
          <li key={e.id} className="border rounded p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{e.cliente || 'Sem cliente'}</p>
              <span className={`text-xs px-2 py-1 rounded ${CORES_STATUS[e.status] || 'bg-gray-100 text-gray-800'}`}>
                {e.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{e.endereco || 'Sem endereço'}</p>
            {e.token_rastreio && (
              <p className="text-xs text-gray-400 mt-1">
                Rastreio: /rastreio/{e.token_rastreio}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
