import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useWebSocket(tipo) {
  const [socket, setSocket] = useState(null);
  const [entregadores, setEntregadores] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Conectado ao servidor');
      setConectado(true);
      
      if (tipo === 'entregador') {
        const nome = localStorage.getItem('nome-entregador') || 'Entregador';
        newSocket.emit('registrar-entregador', {
          nome: nome,
          posicao: { lat: -23.5505, lng: -46.6333 }
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Desconectado');
      setConectado(false);
    });

    newSocket.on('entregadores-atualizados', (data) => {
      setEntregadores(data);
    });

    newSocket.on('notificacao', (data) => {
      setNotificacoes(prev => [data, ...prev].slice(0, 10));
    });

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [tipo]);

  const atualizarPosicao = useCallback((posicao) => {
    if (socketRef.current && conectado) {
      socketRef.current.emit('atualizar-posicao', { posicao });
    }
  }, [conectado]);

  const concluirEntrega = useCallback((nome) => {
    if (socketRef.current && conectado) {
      socketRef.current.emit('entrega-concluida', { nome });
    }
  }, [conectado]);

  return {
    conectado,
    entregadores,
    notificacoes,
    atualizarPosicao,
    concluirEntrega
  };
}