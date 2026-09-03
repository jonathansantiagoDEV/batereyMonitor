const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  path: '/socket.io/'
});

const entregadores = new Map();
const historicoRotas = new Map();

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    entregadores: Array.from(entregadores.values()).map(e => ({
      id: e.id,
      nome: e.nome,
      status: e.status
    }))
  });
});

io.on('connection', (socket) => {
  console.log(`🟢 Conectado: ${socket.id}`);

  socket.on('registrar-entregador', (data) => {
    const entregador = {
      id: socket.id,
      nome: data.nome || 'Entregador',
      posicao: data.posicao || { lat: -23.5505, lng: -46.6333 },
      status: 'ativo',
      ultimaAtualizacao: new Date(),
      rota: [data.posicao || { lat: -23.5505, lng: -46.6333 }]
    };
    
    entregadores.set(socket.id, entregador);
    historicoRotas.set(socket.id, [entregador.posicao]);
    
    console.log(`📦 Registrado: ${entregador.nome}`);
    io.emit('entregadores-atualizados', Array.from(entregadores.values()));
    io.emit('notificacao', {
      tipo: 'entrada',
      mensagem: `🚚 ${entregador.nome} entrou no sistema!`,
      entregadorId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('atualizar-posicao', (data) => {
    if (entregadores.has(socket.id)) {
      const entregador = entregadores.get(socket.id);
      entregador.posicao = data.posicao;
      entregador.ultimaAtualizacao = new Date();
      
      if (historicoRotas.has(socket.id)) {
        const rota = historicoRotas.get(socket.id);
        rota.push(data.posicao);
        if (rota.length > 100) rota.shift();
        entregador.rota = rota;
      }
      
      entregadores.set(socket.id, entregador);
      io.emit('posicao-atualizada', {
        id: socket.id,
        posicao: data.posicao,
        timestamp: new Date()
      });
      io.emit('entregadores-atualizados', Array.from(entregadores.values()));
    }
  });

  socket.on('entrega-concluida', (data) => {
    const entregador = entregadores.get(socket.id);
    if (entregador) {
      io.emit('notificacao', {
        tipo: 'entrega',
        mensagem: `✅ ${entregador.nome} concluiu uma entrega!`,
        entregadorId: socket.id,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    if (entregadores.has(socket.id)) {
      const entregador = entregadores.get(socket.id);
      console.log(`🔴 Desconectado: ${entregador.nome}`);
      entregadores.delete(socket.id);
      historicoRotas.delete(socket.id);
      io.emit('entregadores-atualizados', Array.from(entregadores.values()));
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${PORT}`);
});