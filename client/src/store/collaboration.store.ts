import { create } from 'zustand';

export interface CollaboratorPresence {
  socketId?: string;
  userId: string;
  name?: string;
  email: string;
  role?: string;
  color: string;
  joinedAt?: string;
  activity?: string;
  cursor?: { x: number; y: number };
  selectedNodeId?: string;
}

interface CollaborationState {
  collaborators: CollaboratorPresence[];
  activeInvestigationId: string | null;
  setActiveInvestigation: (id: string | null) => void;
  setCollaborators: (users: CollaboratorPresence[]) => void;
  addCollaborator: (c: CollaboratorPresence) => void;
  removeCollaborator: (userIdOrSocketId: string) => void;
  updateCollaborator: (userIdOrSocketId: string, data: Partial<CollaboratorPresence>) => void;
}

export const useCollaborationStore = create<CollaborationState>()(set => ({
  collaborators: [],
  activeInvestigationId: null,
  setActiveInvestigation: id => set({ activeInvestigationId: id }),
  setCollaborators: users => set({ collaborators: users }),
  addCollaborator: c =>
    set(s => ({
      collaborators: [
        ...s.collaborators.filter(x => x.userId !== c.userId && (!c.socketId || x.socketId !== c.socketId)),
        c,
      ],
    })),
  removeCollaborator: identifier =>
    set(s => ({
      collaborators: s.collaborators.filter(c => c.userId !== identifier && c.socketId !== identifier),
    })),
  updateCollaborator: (identifier, data) =>
    set(s => ({
      collaborators: s.collaborators.map(c =>
        c.userId === identifier || c.socketId === identifier ? { ...c, ...data } : c
      ),
    })),
}));
