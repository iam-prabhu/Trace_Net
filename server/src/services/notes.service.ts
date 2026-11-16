import { Note } from '../types/investigation.types';
import { investigationRepository } from '../repositories/investigation.repository';

export async function getNotes(investigationId: string): Promise<Note[]> {
  return investigationRepository.getNotes(investigationId);
}

export async function getNoteById(id: string): Promise<Note | null> {
  return investigationRepository.getNoteById(id);
}

export async function createNote(
  data: Partial<Note>,
  authorId: string = 'usr-001',
  authorName: string = 'Investigator'
): Promise<Note> {
  if (!data.investigationId) {
    throw new Error('investigationId is required');
  }
  if (!data.content) {
    throw new Error('content is required');
  }

  return investigationRepository.createNote({
    investigationId: data.investigationId,
    content: data.content,
    authorId: data.authorId || authorId,
    authorName: data.authorName || authorName,
    targetAccountId: data.targetAccountId,
    targetTransactionId: data.targetTransactionId,
    isPinned: data.isPinned,
  });
}

export async function updateNote(
  id: string,
  content: string,
  userId?: string,
  userRole?: string
): Promise<Note | null> {
  const existing = await investigationRepository.getNoteById(id);
  if (!existing) return null;

  // Check author or admin permission
  if (userId && userRole?.toUpperCase() !== 'ADMIN' && existing.authorId !== userId) {
    throw new Error('Only the author or an admin can edit this note');
  }

  return investigationRepository.updateNote(id, { content });
}

export async function deleteNote(
  id: string,
  userId?: string,
  userRole?: string
): Promise<boolean> {
  const existing = await investigationRepository.getNoteById(id);
  if (!existing) return false;

  if (userId && userRole?.toUpperCase() !== 'ADMIN' && existing.authorId !== userId) {
    throw new Error('Only the author or an admin can delete this note');
  }

  return investigationRepository.deleteNote(id);
}
