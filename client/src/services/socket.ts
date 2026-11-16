import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../utils/constants';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const token = localStorage.getItem('accessToken');
    socketInstance = io(WS_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection warning:', err.message);
    });
  }
  return socketInstance;
}

export function reconnectSocketWithToken(token: string): Socket {
  if (socketInstance) {
    socketInstance.disconnect();
  }
  socketInstance = io(WS_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
