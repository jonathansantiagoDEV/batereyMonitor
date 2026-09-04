'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import SimuladorEntregador from '@/components/SimuladorEntregador';

const MapaEmTempoReal = dynamic(() => import('@/components/MapaChefe'), { ssr: false });

export interface EntregadorMapa {
  entregador_id: string;
  nome: string;
  latitude: number;
  longitude: number;
  velocidade: number | null;
  created_at: string;
  historico: [number, number][];
}

export default function ChefeDashboardPage() {
  const [entregadores, setEntregadores] = useState<Record<string, EntregadorMapa>>({});
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function carregarPosicoesIniciais() {
      const { data, error } = await supabase
        .from('ultimas_localizacoes')
        .select('*');

      if (!error && data) {
        const mapaInicial: Record<string, EntregadorMapa> = {};
        data.forEach((item: any) => {
          mapaInicial[item.entregador_id] = {
            ...item,
            historico: [[item.latitude, item.longitude]]
          };
        });
        setEntregadores(mapaInicial);
      }
      setCarregando(false);
    }

    carregarPosicoesIniciais();

    const canal = supabase
      .channel('monitoramento-gps')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'localizacoes' },
        (payload) => {
          const novaLoc = payload.new;
          const novaPonta: [number, number] = [novaLoc.latitude, novaLoc.longitude];

          setEntregadores((prev) => {
            const entregadorAtual = prev[novaLoc.entregador_id];
            const historicoAntigo = entregadorAtual?.historico || [];

            // Se passou muito tempo desde o último ponto registrado, é uma
            // nova corrida (não uma continuação da anterior) — reinicia o
            // histórico em vez de emendar, senão o mapa desenha uma linha
            // reta "voadora" ligando o fim da corrida antiga ao início da
            // nova.
            const ultimoTimestamp = entregadorAtual?.created_at
              ? new Date(entregadorAtual.created_at).getTime()
              : null;
            const novoTimestamp = novaLoc.created_at
              ? new Date(novaLoc.created_at).getTime()
              : null;
            const GAP_MAXIMO_MS = 60_000; // 1 minuto sem atualização = nova corrida

            const houveGap =
              ultimoTimestamp !== null &&
              novoTimestamp !== null &&
              novoTimestamp - ultimoTimestamp > GAP_MAXIMO_MS;

            const historicoBase = houveGap ? [] : historicoAntigo;

            return {
              ...prev,
              [novaLoc.entregador_id]: {
                ...entregadorAtual,
                entregador_id: novaLoc.entregador_id,
                latitude: novaLoc.latitude,
                longitude: novaLoc.longitude,
                velocidade: novaLoc.velocidade,
                created_at: novaLoc.created_at,
                historico: [...historicoBase, novaPonta],
              },
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const listaEntregadores = Object.values(entregadores).filter((e) =>
    (e.nome || 'Entregador').toLowerCase().includes(busca.toLowerCase())
  );

  const emMovimento = listaEntregadores.filter((e) => e.velocidade && e.velocidade > 0.5).length;
  const parados = listaEntregadores.length - emMovimento;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Lateral */}
      <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
              <h1 className="text-lg font-bold text-white tracking-wide">Radar de Entregas</h1>
            </div>
            <Link href="/perfil" className="text-xs text-blue-400 font-medium">
              Meu perfil
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-1">Acompanhamento em tempo real</p>

          <input
            type="text"
            placeholder="Buscar entregador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full mt-3 px-3 py-2 text-sm bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Resumo de Indicadores */}
        <div className="grid grid-cols-2 gap-2 p-4 border-b border-gray-800 text-center">
          <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400">Em Movimento</span>
            <p className="text-lg font-bold text-green-400">{emMovimento}</p>
          </div>
          <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-800">
            <span className="text-xs text-gray-400">Parados</span>
            <p className="text-lg font-bold text-yellow-400">{parados}</p>
          </div>
        </div>

        {/* Simulador de entregador (testes sem entregador real em campo) */}
        <SimuladorEntregador />

        {/* Lista de Entregadores */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h2 className="text-xs text-gray-400 uppercase font-semibold">
            Funcionários ({listaEntregadores.length})
          </h2>

          {carregando ? (
            <p className="text-xs text-gray-500">Conectando ao sinal GPS...</p>
          ) : listaEntregadores.length === 0 ? (
            <p className="text-xs text-gray-500">Nenhum entregador em rota.</p>
          ) : (
            listaEntregadores.map((e) => {
              const kmh = e.velocidade ? (e.velocidade * 3.6).toFixed(1) : '0';
              const estaEmMovimento = Number(kmh) > 0.5;

              return (
                <div
                  key={e.entregador_id}
                  className="p-3 bg-gray-800/70 hover:bg-gray-800 rounded-lg border border-gray-700/60 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-white">
                      {e.nome || 'Entregador'}
                    </span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        estaEmMovimento ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                      }`}
                    ></span>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                    <span>
                      Velocidade: <strong className="text-gray-200">{kmh} km/h</strong>
                    </span>
                    <span>{e.historico?.length || 0} pontos</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Área do Mapa */}
      <main className="flex-1 relative">
        <MapaEmTempoReal entregadores={listaEntregadores} />
      </main>
    </div>
  );
}