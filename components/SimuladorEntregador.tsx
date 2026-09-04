'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getOuCriarEntregador, atualizarStatusEntregador } from '@/lib/entregadorService';
import { registrarLocalizacao } from '@/lib/localizacaoService';
import {
  geocodificarEndereco,
  obterRota,
  distanciaMetros,
  Coordenada,
  SugestaoEndereco,
} from '@/lib/routingService';
import EnderecoAutocomplete from '@/components/EnderecoAutocomplete';

const INTERVALO_MS = 3000; // a cada quanto tempo grava uma localização
const DURACAO_ALVO_S = 90; // tempo total (aprox.) que a simulação leva pra completar a rota

export default function SimuladorEntregador() {
  const [aberto, setAberto] = useState(false);
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('Esquinas Baterias, Mandacaru, João Pessoa - PB');
  // Guarda a coordenada exata quando o usuário escolhe uma sugestão do
  // autocomplete, pra não precisar geocodificar o endereço de novo.
  const [origemCoord, setOrigemCoord] = useState<Coordenada | null>(null);
  const [destinoCoord, setDestinoCoord] = useState<Coordenada | null>(null);
  const [rodando, setRodando] = useState(false);
  const [obtendoLocal, setObtendoLocal] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState('');
  const [status, setStatus] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const entregadorIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Garante que a simulação para se o componente sair de tela (troca de
    // página) — senão o setInterval continuaria rodando escondido.
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
      setErro('Seu navegador não suporta geolocalização.');
      return;
    }
    setObtendoLocal(true);
    setErro('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigem(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        setOrigemCoord(null);
        setObtendoLocal(false);
      },
      () => {
        setErro('Não foi possível obter sua localização. Verifique a permissão de GPS do navegador.');
        setObtendoLocal(false);
      },
      { enableHighAccuracy: true }
    );
  }

  function aoMudarOrigem(texto: string) {
    setOrigem(texto);
    setOrigemCoord(null);
  }

  function aoMudarDestino(texto: string) {
    setDestino(texto);
    setDestinoCoord(null);
  }

  function aoSelecionarOrigem(s: SugestaoEndereco) {
    setOrigemCoord({ lat: s.lat, lon: s.lon });
  }

  function aoSelecionarDestino(s: SugestaoEndereco) {
    setDestinoCoord({ lat: s.lat, lon: s.lon });
  }

  function parseCoordenadaDireta(texto: string): Coordenada | null {
    // Se o campo já estiver no formato "lat, lon" (preenchido pelo botão de
    // localização atual, ou colado de algum mapa), usa direto em vez de
    // geocodificar por endereço. Aceita espaços/parênteses/ponto-e-vírgula
    // extras ao redor dos números.
    const limpo = texto.trim();
    const match = limpo.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)?$/);
    if (!match) return null;

    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

    return { lat, lon };
  }

  async function resolverEndereco(
    texto: string,
    coordSelecionada: Coordenada | null
  ): Promise<Coordenada | null> {
    const direta = parseCoordenadaDireta(texto);
    if (direta) return direta;
    // Se o endereço veio de uma sugestão do autocomplete, já temos a
    // coordenada exata — evita bater de novo no Nominatim.
    if (coordSelecionada) return coordSelecionada;
    return geocodificarEndereco(texto);
  }

  async function iniciarSimulacao() {
    setErro('');

    if (!origem.trim() || !destino.trim()) {
      setErro('Preencha origem e destino.');
      return;
    }

    setStatus('Localizando endereços...');
    setRodando(true);

    const pontoOrigem = await resolverEndereco(origem, origemCoord);
    if (!pontoOrigem) {
      setErro('Não encontrei o endereço de origem. Tente ser mais específico (rua, bairro, cidade).');
      setRodando(false);
      setStatus('');
      return;
    }

    const pontoDestino = await resolverEndereco(destino, destinoCoord);
    if (!pontoDestino) {
      setErro('Não encontrei o endereço de destino. Tente ser mais específico (rua, bairro, cidade).');
      setRodando(false);
      setStatus('');
      return;
    }

    setStatus('Calculando rota pelas ruas...');
    let rota: Coordenada[];
    try {
      rota = await obterRota(pontoOrigem, pontoDestino);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao calcular a rota.');
      setRodando(false);
      setStatus('');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const usuarioId = userData.user?.id;
    if (!usuarioId) {
      setErro('Você precisa estar logado.');
      setRodando(false);
      setStatus('');
      return;
    }

    const { data: entregador, error: erroEntregador } = await getOuCriarEntregador(usuarioId);
    if (erroEntregador || !entregador) {
      setErro(erroEntregador?.message || 'Não foi possível preparar o entregador simulado.');
      setRodando(false);
      setStatus('');
      return;
    }

    entregadorIdRef.current = entregador.id;
    await atualizarStatusEntregador(entregador.id, 'EM_ROTA');

    // Distância acumulada em cada ponto da rota — permite andar por distância
    // (em vez de "um ponto por tick", que ficaria com velocidade irregular
    // já que os pontos do OSRM não são igualmente espaçados).
    const acumulada: number[] = [0];
    for (let i = 1; i < rota.length; i++) {
      acumulada[i] = acumulada[i - 1] + distanciaMetros(rota[i - 1], rota[i]);
    }
    const distanciaTotal = acumulada[acumulada.length - 1];

    const totalTicks = Math.max(1, Math.round(DURACAO_ALVO_S * 1000 / INTERVALO_MS));
    const passoMetros = distanciaTotal / totalTicks;
    const velocidadeMs = passoMetros / (INTERVALO_MS / 1000);

    function pontoNaDistancia(alvo: number): Coordenada {
      if (alvo <= 0) return rota[0];
      if (alvo >= distanciaTotal) return rota[rota.length - 1];

      let i = 1;
      while (i < acumulada.length && acumulada[i] < alvo) i++;

      const inicio = acumulada[i - 1];
      const fim = acumulada[i];
      const fracao = fim === inicio ? 0 : (alvo - inicio) / (fim - inicio);

      const a = rota[i - 1];
      const b = rota[i];
      return {
        lat: a.lat + (b.lat - a.lat) * fracao,
        lon: a.lon + (b.lon - a.lon) * fracao,
      };
    }

    setStatus('Simulando corrida...');

    let distanciaPercorrida = 0;
    let tick = 0;

    intervalRef.current = setInterval(async () => {
      tick++;
      distanciaPercorrida = Math.min(distanciaTotal, tick * passoMetros);

      const ponto = pontoNaDistancia(distanciaPercorrida);
      const velocidadeAtual = distanciaPercorrida >= distanciaTotal ? 0 : velocidadeMs;

      await registrarLocalizacao(entregador.id, ponto.lat, ponto.lon, velocidadeAtual);
      setProgresso(Math.round((distanciaPercorrida / distanciaTotal) * 100));

      if (distanciaPercorrida >= distanciaTotal) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        await atualizarStatusEntregador(entregador.id, 'AGUARDANDO');
        setRodando(false);
        setStatus('Simulação concluída — chegou ao destino.');
      }
    }, INTERVALO_MS);
  }

  async function pararSimulacao() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (entregadorIdRef.current) {
      await atualizarStatusEntregador(entregadorIdRef.current, 'AGUARDANDO');
    }
    setRodando(false);
    setStatus('Simulação interrompida.');
  }

  return (
    <div className="border-b border-gray-800">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-xs text-gray-400 uppercase font-semibold">
          Simular entregador
        </span>
        <span className="text-gray-500 text-xs">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex gap-2">
            <EnderecoAutocomplete
              tema="escuro"
              className="w-full px-3 py-2 text-sm bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
              placeholder="Endereço de origem"
              value={origem}
              onChange={aoMudarOrigem}
              onSelect={aoSelecionarOrigem}
              disabled={rodando}
            />
            <button
              onClick={usarLocalizacaoAtual}
              disabled={rodando || obtendoLocal}
              className="px-2 text-xs bg-gray-700 text-white rounded-md disabled:opacity-50 whitespace-nowrap"
              title="Usar minha localização atual"
            >
              {obtendoLocal ? '...' : '📍 Aqui'}
            </button>
          </div>

          <EnderecoAutocomplete
            tema="escuro"
            className="w-full px-3 py-2 text-sm bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-500"
            placeholder="Endereço de destino"
            value={destino}
            onChange={aoMudarDestino}
            onSelect={aoSelecionarDestino}
            disabled={rodando}
          />

          {!rodando ? (
            <button
              onClick={iniciarSimulacao}
              disabled={obtendoLocal}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-md disabled:opacity-50"
            >
              {obtendoLocal ? 'Aguardando GPS...' : 'Iniciar simulação'}
            </button>
          ) : (
            <button
              onClick={pararSimulacao}
              className="w-full bg-red-600 hover:bg-red-500 text-white text-sm py-2 rounded-md"
            >
              Parar simulação
            </button>
          )}

          {status && (
            <p className="text-xs text-gray-400">
              {status} {rodando && `(${progresso}%)`}
            </p>
          )}
          {erro && <p className="text-xs text-red-400">{erro}</p>}
        </div>
      )}
    </div>
  );
}
