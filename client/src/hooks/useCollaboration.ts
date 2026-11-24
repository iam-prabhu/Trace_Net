import { useEffect } from 'react';
import { useCollaborationStore, CollaboratorPresence } from '../store/collaboration.store';
import { getSocket } from '../services/socket';
import { getInvestigationMembers } from '../services/investigation.service';

export function useCollaboration(investigationId?: string) {
  const {
    collaborators,
    setActiveInvestigation,
    setCollaborators,
    addCollaborator,
    removeCollaborator,
    updateCollaborator,
  } = useCollaborationStore();

  useEffect(() => {
    if (!investigationId) return;
    setActiveInvestigation(investigationId);

    // Initial REST sync of current room members
    getInvestigationMembers(investigationId).then(members => {
      if (members.length > 0) {
        setCollaborators(members);
      }
    });

    let socket: any = null;
    try {
      socket = getSocket();

      // Join room
      socket.emit('investigation:join', investigationId);

      // Presence list snapshot on joining
      socket.on('investigation:presence-list', (data: { investigationId: string; users: CollaboratorPresence[] }) => {
        if (data.users) {
          setCollaborators(data.users);
        }
      });

      socket.on('investigation:users', (data: { investigationId: string; users: CollaboratorPresence[] }) => {
        if (data.users) {
          setCollaborators(data.users);
        }
      });

      // Another user joined
      socket.on('investigation:user-joined', (data: { investigationId: string; user: CollaboratorPresence; users?: CollaboratorPresence[] }) => {
        if (data.users) {
          setCollaborators(data.users);
        } else if (data.user) {
          addCollaborator(data.user);
        }
      });

      // User left
      socket.on('investigation:user-left', (data: { investigationId: string; userId: string; socketId?: string; users?: CollaboratorPresence[] }) => {
        if (data.users) {
          setCollaborators(data.users);
        } else {
          removeCollaborator(data.userId || data.socketId || '');
        }
      });

      // Presence update (activity, cursor, etc.)
      socket.on('investigation:presence', (data: { userId: string; activity?: string; cursor?: { x: number; y: number } }) => {
        updateCollaborator(data.userId, { activity: data.activity, cursor: data.cursor });
      });
    } catch (err) {
      console.warn('Socket useCollaboration error:', err);
    }

    return () => {
      if (socket) {
        socket.emit('investigation:leave', investigationId);
        socket.off('investigation:presence-list');
        socket.off('investigation:users');
        socket.off('investigation:user-joined');
        socket.off('investigation:user-left');
        socket.off('investigation:presence');
      }
      setActiveInvestigation(null);
    };
  }, [investigationId, setActiveInvestigation, setCollaborators, addCollaborator, removeCollaborator, updateCollaborator]);

  return { collaborators };
}
