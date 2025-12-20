import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from './api';

const SOCKET_URL = BACKEND_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  async connect() {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    // Si ya existe un socket pero no está conectado, limpiarlo primero
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const token = await AsyncStorage.getItem('token');
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: token ? { token } : {},
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.once('connect', () => {
        console.log('Socket connected');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.once('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      // Timeout de 10 segundos
      setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Socket connection timeout'));
        }
      }, 10000);
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
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-game', roomCode);
    } else {
      console.warn('Socket not connected, cannot join game');
    }
  }

  leaveGame(roomCode) {
    if (this.socket) {
      this.socket.emit('leave-game', roomCode);
    }
  }

  onGameUpdated(callback) {
    if (!this.socket) return;

    // Remover listener anterior si existe
    if (this.listeners.has('game-updated')) {
      this.socket.off('game-updated', this.listeners.get('game-updated'));
    }

    const handler = () => {
      callback();
    };

    this.socket.on('game-updated', handler);
    this.listeners.set('game-updated', handler);
  }

  onGameCancelled(callback) {
    if (!this.socket) return;

    // Remover listener anterior si existe
    if (this.listeners.has('game-cancelled')) {
      this.socket.off('game-cancelled', this.listeners.get('game-cancelled'));
    }

    const handler = (data) => {
      callback(data);
    };

    this.socket.on('game-cancelled', handler);
    this.listeners.set('game-cancelled', handler);
  }

  emitGameUpdate(roomCode) {
    if (this.socket && this.socket.connected) {
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

