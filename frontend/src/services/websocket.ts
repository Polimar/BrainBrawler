import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  // In development with Vite proxy, we can connect to the same host.
  // In production, this might need to point to the actual backend URL.
  return window.location.origin;
};

class WebSocketManager {
  private socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    const socketUrl = getSocketUrl();
    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.authenticate(token);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  authenticate(token: string): void {
    this.socket?.emit('authenticate', token);
  }
  
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.socket?.on(event, listener);
  }

  off(event: string, listener?: (...args: any[]) => void): void {
    this.socket?.off(event, listener);
    }
  }

export const socketManager = new WebSocketManager(); 