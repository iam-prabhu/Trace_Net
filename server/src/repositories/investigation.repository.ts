import {
  Investigation,
  Finding,
  Note,
} from '../types/investigation.types';
import { inMemoryStore } from './in-memory.store';

export class InvestigationRepository {
  // =====================
  // Investigations
  // =====================
  async getInvestigations(filter?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<Investigation[]> {
    const map = new Map<string, Investigation>();
    for (const [, inv] of inMemoryStore.investigations) {
      map.set(inv.title || inv.id, inv);
    }
    let list = Array.from(map.values());

    if (filter?.status && filter.status !== 'ALL') {
      const s = filter.status.toUpperCase();
      list = list.filter(inv => inv.status.toUpperCase() === s);
    }

    if (filter?.priority && filter.priority !== 'ALL') {
      const p = filter.priority.toUpperCase();
      list = list.filter(inv => inv.priority.toUpperCase() === p);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        inv =>
          inv.title.toLowerCase().includes(q) ||
          inv.description.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt desc
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return list;
  }

  async getInvestigationById(id: string): Promise<Investigation | null> {
    const inv = inMemoryStore.investigations.get(id);
    if (inv) return inv;
    for (const [, item] of inMemoryStore.investigations) {
      if (item.id.toLowerCase() === id.toLowerCase() || item.title.toLowerCase().includes(id.toLowerCase())) {
        return item;
      }
    }
    return null;
  }

  async createInvestigation(data: {
    title: string;
    description?: string;
    priority?: string;
    initialAccountIds?: string[];
    assignedUserIds?: string[];
    assignedTo?: string;
    createdBy: string;
  }): Promise<Investigation> {
    const id = `inv-${Date.now()}`;
    const initialAccounts = data.initialAccountIds || [];

    const newInv: Investigation = {
      id,
      title: data.title,
      description: data.description || '',
      status: 'OPEN',
      priority: (data.priority?.toUpperCase() as any) || 'MEDIUM',
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
      assignedUserIds: data.assignedUserIds || [],
      initialAccountIds: initialAccounts,
      nodeIds: initialAccounts,
      edgeIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryStore.investigations.set(id, newInv);
    return newInv;
  }

  async updateInvestigation(
    id: string,
    updates: Partial<Investigation>
  ): Promise<Investigation | null> {
    let inv = inMemoryStore.investigations.get(id);
    let keyToUpdate = id;

    if (!inv) {
      for (const [key, item] of inMemoryStore.investigations) {
        if (item.id.toLowerCase() === id.toLowerCase() || item.title.toLowerCase().includes(id.toLowerCase())) {
          inv = item;
          keyToUpdate = key;
          break;
        }
      }
    }
    if (!inv) return null;

    const updated: Investigation = {
      ...inv,
      ...updates,
      id: inv.id, // prevent changing ID
      updatedAt: new Date(),
    };

    // Update all matching aliases in store
    for (const [key, item] of inMemoryStore.investigations) {
      if (item.id.toLowerCase() === id.toLowerCase() || item.title === inv.title) {
        inMemoryStore.investigations.set(key, { ...item, ...updates, updatedAt: new Date() });
      }
    }
    return updated;
  }

  async deleteInvestigation(id: string): Promise<boolean> {
    return inMemoryStore.investigations.delete(id);
  }

  // =====================
  // Findings
  // =====================
  async getFindings(investigationId?: string): Promise<Finding[]> {
    let list = Array.from(inMemoryStore.findings.values());
    if (investigationId) {
      list = list.filter(f => f.investigationId === investigationId);
    }
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }

  async getFindingById(id: string): Promise<Finding | null> {
    return inMemoryStore.findings.get(id) || null;
  }

  async createFinding(data: {
    investigationId: string;
    title: string;
    description?: string;
    findingType?: string;
    severity?: string;
    status?: string;
    involvedAccounts?: string[];
    nodeIds?: string[];
    relevantTransactions?: string[];
    edgeIds?: string[];
    rationale?: string;
    metadata?: Record<string, unknown>;
    createdBy: string;
  }): Promise<Finding> {
    const id = `fnd-${Date.now()}`;
    const nodeIds = data.nodeIds || data.involvedAccounts || [];
    const edgeIds = data.edgeIds || data.relevantTransactions || [];

    const finding: Finding = {
      id,
      investigationId: data.investigationId,
      title: data.title,
      description: data.description || '',
      findingType: data.findingType || 'ANOMALY',
      severity: (data.severity?.toUpperCase() as any) || 'MEDIUM',
      status: (data.status?.toUpperCase() as any) || 'PENDING',
      involvedAccounts: nodeIds,
      nodeIds,
      relevantTransactions: edgeIds,
      edgeIds,
      rationale: data.rationale,
      metadata: data.metadata,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryStore.findings.set(id, finding);

    // Also update investigation nodeIds and edgeIds
    const inv = inMemoryStore.investigations.get(data.investigationId);
    if (inv) {
      const mergedNodes = Array.from(new Set([...inv.nodeIds, ...nodeIds]));
      const mergedEdges = Array.from(new Set([...(inv.edgeIds || []), ...edgeIds]));
      inv.nodeIds = mergedNodes;
      inv.edgeIds = mergedEdges;
      inv.updatedAt = new Date();
    }

    return finding;
  }

  async updateFinding(id: string, updates: Partial<Finding>): Promise<Finding | null> {
    const f = inMemoryStore.findings.get(id);
    if (!f) return null;

    const updated: Finding = {
      ...f,
      ...updates,
      id: f.id,
      updatedAt: new Date(),
    };
    inMemoryStore.findings.set(id, updated);
    return updated;
  }

  async deleteFinding(id: string): Promise<boolean> {
    return inMemoryStore.findings.delete(id);
  }

  // =====================
  // Notes
  // =====================
  async getNotes(investigationId: string): Promise<Note[]> {
    let list = Array.from(inMemoryStore.notes.values()).filter(
      n => n.investigationId === investigationId
    );
    list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return list;
  }

  async getNoteById(id: string): Promise<Note | null> {
    return inMemoryStore.notes.get(id) || null;
  }

  async createNote(data: {
    investigationId: string;
    content: string;
    authorId: string;
    authorName?: string;
    targetAccountId?: string;
    targetTransactionId?: string;
    isPinned?: boolean;
  }): Promise<Note> {
    const id = `note-${Date.now()}`;
    const note: Note = {
      id,
      investigationId: data.investigationId,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName || 'Analyst',
      targetAccountId: data.targetAccountId,
      targetTransactionId: data.targetTransactionId,
      isPinned: Boolean(data.isPinned),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryStore.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const note = inMemoryStore.notes.get(id);
    if (!note) return null;

    const updated: Note = {
      ...note,
      ...updates,
      id: note.id,
      updatedAt: new Date(),
    };
    inMemoryStore.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    return inMemoryStore.notes.delete(id);
  }
}

export const investigationRepository = new InvestigationRepository();
