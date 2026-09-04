'use client';

import { useEffect, useRef, useState } from 'react';
import { sugerirEnderecos, SugestaoEndereco } from '@/lib/routingService';

type Props = {
  value: string;
  onChange: (texto: string) => void;
  onSelect?: (sugestao: SugestaoEndereco) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** 'claro' pra telas com fundo branco, 'escuro' pra telas com fundo dark. */
  tema?: 'claro' | 'escuro';
};

const DEBOUNCE_MS = 400;

export default function EnderecoAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  disabled,
  tema = 'claro',
}: Props) {
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requisicaoAtualRef = useRef(0);

  // Fecha a lista ao clicar fora do campo.
  useEffect(() => {
    function aoClicarFora(ev: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function aoDigitar(texto: string) {
    onChange(texto);
    setIndiceAtivo(-1);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (texto.trim().length < 3) {
      setSugestoes([]);
      setAberto(false);
      setCarregando(false);
      return;
    }

    const idRequisicao = ++requisicaoAtualRef.current;
    setCarregando(true);

    timeoutRef.current = setTimeout(async () => {
      const resultado = await sugerirEnderecos(texto);
      // Ignora respostas atrasadas de buscas antigas (usuário já digitou mais).
      if (idRequisicao !== requisicaoAtualRef.current) return;

      setSugestoes(resultado);
      setAberto(resultado.length > 0);
      setCarregando(false);
    }, DEBOUNCE_MS);
  }

  function selecionar(s: SugestaoEndereco) {
    onChange(s.label);
    setSugestoes([]);
    setAberto(false);
    onSelect?.(s);
  }

  function aoTeclar(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto || sugestoes.length === 0) return;

    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setIndiceAtivo((i) => Math.min(i + 1, sugestoes.length - 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setIndiceAtivo((i) => Math.max(i - 1, 0));
    } else if (ev.key === 'Enter') {
      // Se o usuário não navegou com as setas, seleciona a primeira
      // sugestão da lista (comportamento esperado ao apertar Enter direto).
      ev.preventDefault();
      const indice = indiceAtivo >= 0 ? indiceAtivo : 0;
      selecionar(sugestoes[indice]);
    } else if (ev.key === 'Escape') {
      setAberto(false);
    }
  }

  const estiloLista =
    tema === 'escuro'
      ? 'bg-gray-800 border-gray-700 text-gray-100'
      : 'bg-white border-gray-300 text-gray-900';

  const estiloItemAtivo = tema === 'escuro' ? 'bg-gray-700' : 'bg-gray-100';
  const estiloItemHover = tema === 'escuro' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => aoDigitar(e.target.value)}
        onFocus={() => sugestoes.length > 0 && setAberto(true)}
        onKeyDown={aoTeclar}
        autoComplete="off"
      />

      {carregando && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
          ...
        </span>
      )}

      {aberto && sugestoes.length > 0 && (
        <ul
          className={`absolute z-[1000] left-0 right-0 mt-1 border rounded-md shadow-lg max-h-56 overflow-y-auto text-sm ${estiloLista}`}
        >
          {sugestoes.map((s, i) => (
            <li
              key={`${s.lat}-${s.lon}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selecionar(s);
              }}
              className={`px-3 py-2 cursor-pointer ${
                i === indiceAtivo ? estiloItemAtivo : estiloItemHover
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
