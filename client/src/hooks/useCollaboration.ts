import { useEffect } from 'react';
import { useCollaborationStore } from '../store/collaboration.store';
import { useWebSocket } from './useWebSocket';

export function useCollaboration(investigationId?: string) {
  const { collaborators, setActiveInvestigation, addCollaborator, removeCollaborator } =
    useCollaborationStore();
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!investigationId || !socket) return;
    setActiveInvestigation(investigationId);
    socket.emit('join:investigation', investigationId);

    socket.on('user:joined', (data: { userId: string }) => {
      addCollaborator({ userId: data.userId, email: '', color: '#' + Math.floor(Math.random()*16777215).toString(16) });
    });
    socket.on('user:left', (data: { userId: string }) => {
      removeCollaborator(data.userId);
    });

    return () => {
      socket.emit('leave:investigation', investigationId);
      socket.off('user:joined');
      socket.off('user:left');
    };
  }, [investigationId, socket, setActiveInvestigation, addCollaborator, removeCollaborator]);

  return { collaborators };
}
