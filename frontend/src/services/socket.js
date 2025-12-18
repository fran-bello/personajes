import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('token');
    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  joinGame(roomCode) {
    if (this.socket) {
      this.socket.emit('join-game', roomCode);
    }
  }

  leaveGame(roomCode) {
    if (this.socket) {
      this.socket.emit('leave-game', roomCode);
    }
  }

  onGameUpdated(callback) {
    if (!this.socket) return;

    const handler = () => {
      callback();
    };

    this.socket.on('game-updated', handler);
    this.listeners.set('game-updated', handler);
  }

  onGameCancelled(callback) {
    if (!this.socket) return;

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('game-cancelled', handler);
    this.listeners.set('game-cancelled', handler);
  }

  emitGameUpdate(roomCode) {
    if (this.socket) {
      this.socket.emit('game-update', roomCode);
    }
  }

  removeListener(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event));
      this.listeners.delete(event);
    }
  }
}

export const socketService = new SocketService();
