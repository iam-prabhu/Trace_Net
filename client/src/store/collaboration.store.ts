import { create } from 'zustand';

interface CollaboratorPresence {
  userId: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedNodeId?: string;
}

interface CollaborationState {
  collaborators: CollaboratorPresence[];
  activeInvestigationId: string | null;
  setActiveInvestigation: (id: string | null) => void;
  addCollaborator: (c: CollaboratorPresence) => void;
  removeCollaborator: (userId: string) => void;
  updateCollaborator: (userId: string, data: Partial<CollaboratorPresence>) => void;
}

export const useCollaborationStore = create<CollaborationState>()(set => ({
  collaborators: [],
  activeInvestigationId: null,
  setActiveInvestigation: id => set({ activeInvestigationId: id }),
  addCollaborator: c =>
    set(s => ({ collaborators: [...s.collaborators.filter(x => x.userId !== c.userId), c] })),
  removeCollaborator: userId =>
    set(s => ({ collaborators: s.collaborators.filter(c => c.userId !== userId) })),
  updateCollaborator: (userId, data) =>
    set(s => ({
      collaborators: s.collaborators.map(c =>
        c.userId === userId ? { ...c, ...data } : c
      ),
    })),
}));
