import { Response, NextFunction } from 'express';
import * as notesService from '../services/notes.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getNotes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const investigationId = String(req.params.investigationId || req.query.investigationId);
    const items = await notesService.getNotes(investigationId);
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function createNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authorId = req.user?.userId || 'usr-001';
    const authorName = req.user?.name || req.user?.email || 'Investigator';
    const item = await notesService.createNote(req.body, authorId, authorName);
    sendSuccess(res, item, 201, 'Note created successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create note', 400);
  }
}

export async function updateNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const content = req.body.content;
    if (!content) {
      sendError(res, 'Content is required', 400);
      return;
    }

    const item = await notesService.updateNote(id, content, req.user?.userId, req.user?.role);
    if (!item) {
      sendError(res, 'Note not found', 404);
      return;
    }
    sendSuccess(res, item, 200, 'Note updated successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update note', 403);
  }
}

export async function deleteNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const success = await notesService.deleteNote(id, req.user?.userId, req.user?.role);
    if (!success) {
      sendError(res, 'Note not found', 404);
      return;
    }
    sendSuccess(res, { deleted: true }, 200, 'Note deleted successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to delete note', 403);
  }
}
