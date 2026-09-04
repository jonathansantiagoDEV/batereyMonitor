'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { registrarLocalizacao } from '@/lib/localizacaoService';
import { getOuCriarEntregador, atualizarStatusEntregador } from '@/lib/entregadorService';

const INTERVALO_MIN_MS = 8000;

export default function EntregadorPage() {
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<'AGUARDANDO' | 'EM_ROTA'>('AGUARDANDO');
  const [erro, setErro] = useState<string | null>(null);
  const entregadorIdRef = useRef<string | null>(null);
  const ultimoEnvioRef = useRef(0);

  async function iniciarRota() {
    setErro(null);
    const { data: userData } = await supabase.auth.getUser();
    const usuarioId = userData.user?.id;
    if (!usuarioId) {
      setErro('Você precisa estar logado.');
      return;
    }

    const { data: entregador, error } = await getOuCriarEntregador(usuarioId);
    if (error || !entregador) {
      setErro(error?.message || 'Não foi possível registrar o entregador.');
      return;
    }

    entregadorIdRef.current = entregador.id;
    await atualizarStatusEntregador(entregador.id, 'EM_ROTA');
    setStatus('EM_ROTA');
  }

  async function encerrarRota() {
    if (entregadorIdRef.current) {
      await atualizarStatusEntregador(entregadorIdRef.current, 'AGUARDANDO');
    }
    setStatus('AGUARDANDO');
  }

  useEffect(() => {
    let watchId: number | undefined;

    if (status === 'EM_ROTA') {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const local = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setPos(local);

          const agora = Date.now();
          if (agora - ultimoEnvioRef.current < INTERVALO_MIN_MS) return;
          ultimoEnvioRef.current = agora;

          if (!entregadorIdRef.current) return;

          const { error } = await registrarLocalizacao(
            entregadorIdRef.current,
            local.latitude,
            local.longitude,
            position.coords.speed ?? null
          );
          if (error) setErro(error.message);
        },
        () => setErro('Erro ao obter localização. Verifique a permissão de GPS.'),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [status]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Entregador</h1>
      <p>Status: {status}</p>

      {status === 'AGUARDANDO' ? (
        <button className="bg-green-600 text-white p-3 rounded mt-3" onClick={iniciarRota}>
          Iniciar rota
        </button>
      ) : (
        <button className="bg-red-600 text-white p-3 rounded mt-3" onClick={encerrarRota}>
          Encerrar rota
        </button>
      )}

      {pos && (
        <p className="mt-3 text-sm text-gray-600">
          {pos.latitude.toFixed(5)} / {pos.longitude.toFixed(5)}
        </p>
      )}
      {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
    </main>
  );
}