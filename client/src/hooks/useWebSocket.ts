import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../utils/constants';

let globalSocket: Socket | null = null;

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (!globalSocket) {
      globalSocket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }

    socketRef.current = globalSocket;

    return () => {
      // Don't disconnect on component unmount — keep alive globally
    };
  }, []);

  return { socket: socketRef.current };
}
