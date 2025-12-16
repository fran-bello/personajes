const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const gameRoutes = require('./routes/games');

// Conectar a la base de datos
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/games', gameRoutes);

// WebSocket para actualizaciones en tiempo real
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('join-game', (roomCode) => {
    socket.join(roomCode);
    console.log(`Usuario ${socket.id} se unió a la sala ${roomCode}`);
  });

  socket.on('leave-game', (roomCode) => {
    socket.leave(roomCode);
    console.log(`Usuario ${socket.id} salió de la sala ${roomCode}`);
  });

  socket.on('game-update', (roomCode) => {
    socket.to(roomCode).emit('game-updated');
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Hacer io disponible en las rutas
app.set('io', io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

