import { io, Socket } from 'socket.io-client';

// Cambiar esto a tu IP local o URL del servidor
const SOCKET_URL = 'http://192.168.100.3:3001';

class SocketService {
  private socket: Socket | null = null;
  private url: string = SOCKET_URL;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(roomCode: string) {
    if (this.socket) {
      this.socket.emit('join-game', roomCode);
    }
  }

  leaveGame(roomCode: string) {
    if (this.socket) {
      this.socket.emit('leave-game', roomCode);
    }
  }

  emitGameUpdate(roomCode: string) {
    if (this.socket) {
      this.socket.emit('game-update', roomCode);
    }
  }

  onGameUpdated(callback: () => void) {
    if (this.socket) {
      this.socket.on('game-updated', callback);
    }
  }

  offGameUpdated() {
    if (this.socket) {
      this.socket.off('game-updated');
    }
  }

  setUrl(url: string) {
    this.url = url;
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
export { SOCKET_URL };

