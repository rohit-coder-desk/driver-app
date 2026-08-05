import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';

class SocketService {
  private socket: Socket | null = null;
  private currentDriverId: number | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  private setupSocketListeners(socketInstance: Socket) {
    socketInstance.on('connect', () => {
      console.log(`[STEP-07] [SOCKET APP] Connected successfully! Socket ID=${socketInstance.id}`);
      if (this.currentDriverId) {
        console.log(`[STEP-08] [SOCKET APP] Emitting join_driver for room: driver_${this.currentDriverId}`);
        socketInstance.emit('join_driver', this.currentDriverId);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[SOCKET APP] Disconnected. Reason:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn(`[STEP-06-ERR] ❌ [SOCKET APP] Connection error: ${error.message}`);
    });

    socketInstance.on('driver_updated', (data) => {
      console.log(`[STEP-09] [SOCKET APP] Received driver_updated event: ${JSON.stringify(data)}`);
      const callbacks = this.listeners.get('driver_updated');
      console.log(`[STEP-10] [SOCKET APP] Notifying ${callbacks ? callbacks.length : 0} registered listeners...`);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error('❌ [SOCKET APP] Listener callback error:', err);
          }
        });
      }
    });
  }

  connect(driverId?: number) {
    if (driverId) {
      this.currentDriverId = Number(driverId);
    }

    const baseUrl = API_BASE_URL.replace(/\/+$/, '');

    if (!this.socket) {
      console.log(`[STEP-06] [SOCKET APP] Initializing Socket.IO connection to: ${baseUrl} for Driver ID=${this.currentDriverId}`);
      this.socket = io(baseUrl, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        autoConnect: true,
        jsonp: false,
      });

      this.setupSocketListeners(this.socket);
    } else {
      if (!this.socket.connected) {
        console.log('⚡ [SOCKET APP] Reconnecting existing socket instance...');
        this.socket.connect();
      }
      if (this.currentDriverId && this.socket.connected) {
        console.log(`🚗 [SOCKET APP] Emitting join_driver for driverId: ${this.currentDriverId}`);
        this.socket.emit('join_driver', this.currentDriverId);
      }
    }
  }

  joinDriverRoom(driverId: number) {
    this.currentDriverId = Number(driverId);
    if (this.socket) {
      if (this.socket.connected) {
        this.socket.emit('join_driver', this.currentDriverId);
        console.log('[SocketService] Emitted join_driver for driverId:', this.currentDriverId);
      }
    } else {
      this.connect(this.currentDriverId);
    }
  }

  leaveDriverRoom() {
    if (this.currentDriverId && this.socket && this.socket.connected) {
      this.socket.emit('leave_driver', this.currentDriverId);
    }
    this.currentDriverId = null;
  }

  onDriverUpdated(callback: (data: any) => void) {
    if (!this.listeners.has('driver_updated')) {
      this.listeners.set('driver_updated', []);
    }
    const list = this.listeners.get('driver_updated')!;
    if (!list.includes(callback)) {
      list.push(callback);
    }

    return () => {
      const currentList = this.listeners.get('driver_updated') || [];
      this.listeners.set(
        'driver_updated',
        currentList.filter((cb) => cb !== callback)
      );
    };
  }

  disconnect() {
    if (this.socket) {
      this.leaveDriverRoom();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }
}

export const socketService = new SocketService();
