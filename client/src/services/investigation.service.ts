import { apiClient } from './api';
import type { Investigation, Finding, Note } from '../types/investigation.types';
import type { ApiResponse } from '../types/index';
import { MOCK_INVESTIGATIONS, MOCK_FINDINGS, MOCK_NOTES } from './mock-data';

let localInvestigations = [...MOCK_INVESTIGATIONS];
let localFindings = [...MOCK_FINDINGS];
let localNotes = [...MOCK_NOTES];

export async function getInvestigations(): Promise<Investigation[]> {
  try {
    const res = await apiClient.get<ApiResponse<Investigation[]>>('/investigations');
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /investigations unavailable, returning local investigations', err);
  }
  return localInvestigations;
}

export async function getInvestigation(id: string): Promise<Investigation> {
  try {
    const res = await apiClient.get<ApiResponse<Investigation>>(`/investigations/${id}`);
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn(`API /investigations/${id} unavailable, checking local`, err);
  }
  const found = localInvestigations.find(inv => inv.id === id);
  if (found) return found;
  return {
    id,
    title: `Case Investigation ${id}`,
    description: 'Detailed financial crime analysis graph session.',
    status: 'open',
    createdBy: 'System User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function createInvestigation(data: Partial<Investigation>): Promise<Investigation> {
  try {
    const res = await apiClient.post<ApiResponse<Investigation>>('/investigations', data);
    if (res.data?.data) {
      localInvestigations.unshift(res.data.data);
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /investigations create failed, saving locally', err);
  }
  const newInv: Investigation = {
    id: `INV-${Date.now().toString().slice(-4)}`,
    title: data.title || 'Untitled Case',
    description: data.description || '',
    status: data.status || 'open',
    createdBy: data.createdBy || 'Investigator',
    assignedTo: data.assignedTo || 'Sarah Lin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localInvestigations.unshift(newInv);
  return newInv;
}

export async function updateInvestigation(id: string, data: Partial<Investigation>): Promise<Investigation> {
  try {
    const res = await apiClient.put<ApiResponse<Investigation>>(`/investigations/${id}`, data);
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /investigations update failed, updating locally', err);
  }
  localInvestigations = localInvestigations.map(inv =>
    inv.id === id ? { ...inv, ...data, updatedAt: new Date().toISOString() } : inv
  );
  return getInvestigation(id);
}

export async function deleteInvestigation(id: string): Promise<void> {
  try {
    await apiClient.delete(`/investigations/${id}`);
  } catch (err) {
    console.warn('API delete investigation failed, deleting locally', err);
  }
  localInvestigations = localInvestigations.filter(inv => inv.id !== id);
}

export async function getFindings(investigationId?: string): Promise<Finding[]> {
  try {
    const res = await apiClient.get<ApiResponse<Finding[]>>('/findings', {
      params: investigationId ? { investigationId } : {},
    });
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /findings unavailable, returning local findings', err);
  }
  if (investigationId) {
    return localFindings.filter(f => f.investigationId === investigationId);
  }
  return localFindings;
}

export async function createFinding(data: Partial<Finding>): Promise<Finding> {
  try {
    const res = await apiClient.post<ApiResponse<Finding>>('/findings', data);
    if (res.data?.data) {
      localFindings.unshift(res.data.data);
      return res.data.data;
    }
  } catch (err) {
    console.warn('API create finding failed, saving locally', err);
  }
  const newFnd: Finding = {
    id: `FND-${Date.now().toString().slice(-4)}`,
    investigationId: data.investigationId || 'INV-2025-001',
    title: data.title || 'New Finding',
    description: data.description || '',
    severity: data.severity || 'high',
    status: data.status || 'pending',
    nodeIds: data.nodeIds || [],
    edgeIds: data.edgeIds || [],
    createdBy: data.createdBy || 'Investigator',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localFindings.unshift(newFnd);
  return newFnd;
}

export async function getNotes(investigationId: string): Promise<Note[]> {
  try {
    const res = await apiClient.get<ApiResponse<Note[]>>(`/notes/${investigationId}`);
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /notes unavailable, returning local notes', err);
  }
  return localNotes.filter(n => n.investigationId === investigationId);
}

export async function createNote(data: Partial<Note>): Promise<Note> {
  try {
    const res = await apiClient.post<ApiResponse<Note>>('/notes', data);
    if (res.data?.data) {
      localNotes.push(res.data.data);
      return res.data.data;
    }
  } catch (err) {
    console.warn('API create note failed, saving locally', err);
  }
  const newNote: Note = {
    id: `NOT-${Date.now().toString().slice(-4)}`,
    investigationId: data.investigationId || '',
    content: data.content || '',
    authorId: data.authorId || 'Marcus Vance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localNotes.push(newNote);
  return newNote;
}
