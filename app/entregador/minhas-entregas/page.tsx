'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getOuCriarEntregador } from '@/lib/entregadorService';
import { listarEntregasDoEntregador, atualizarStatusEntrega, type Entrega } from '@/lib/entregasService';

const PROXIMO_STATUS: Record<string, string> = {
  PENDENTE: 'EM_ROTA',
  EM_ROTA: 'ENTREGUE',
};

const TEXTO_BOTAO: Record<string, string> = {
  PENDENTE: 'Sair para entrega',
  EM_ROTA: 'Marcar como entregue',
};

export default function MinhasEntregas() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [entregadorId, setEntregadorId] = useState<string | null>(null);

  async function carregar() {
    setErro(null);
    const { data: userData } = await supabase.auth.getUser();
    const usuarioId = userData.user?.id;
    if (!usuarioId) {
      setErro('Você precisa estar logado.');
      setCarregando(false);
      return;
    }

    const { data: entregador, error: erroEntregador } = await getOuCriarEntregador(usuarioId);
    if (erroEntregador || !entregador) {
      setErro(erroEntregador?.message || 'Não foi possível carregar seu cadastro de entregador.');
      setCarregando(false);
      return;
    }

    setEntregadorId(entregador.id);

    const { data, error } = await listarEntregasDoEntregador(entregador.id);
    if (error) setErro(error.message);
    else setEntregas(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function avancarStatus(entrega: Entrega) {
    const proximo = PROXIMO_STATUS[entrega.status];
    if (!proximo) return;
    const { error } = await atualizarStatusEntrega(entrega.id, proximo);
    if (error) {
      setErro(error.message);
      return;
    }
    if (entregadorId) {
      const { data } = await listarEntregasDoEntregador(entregadorId);
      setEntregas(data || []);
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Minhas entregas</h1>

      {carregando && <p className="text-gray-500">Carregando...</p>}
      {erro && <p className="text-red-600">{erro}</p>}
      {!carregando && !erro && entregas.length === 0 && (
        <p className="text-gray-500">Nenhuma entrega atribuída a você no momento.</p>
      )}

      <ul className="space-y-3">
        {entregas.map((e) => (
          <li key={e.id} className="border rounded p-3">
            <p className="font-medium">{e.cliente || 'Sem cliente'}</p>
            <p className="text-sm text-gray-600">{e.endereco || 'Sem endereço'}</p>
            <p className="text-xs text-gray-500 mt-1">Status: {e.status}</p>

            {PROXIMO_STATUS[e.status] && (
              <button
                className="mt-2 bg-green-600 text-white text-sm px-3 py-1.5 rounded"
                onClick={() => avancarStatus(e)}
              >
                {TEXTO_BOTAO[e.status]}
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
