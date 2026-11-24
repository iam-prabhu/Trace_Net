import { Response, NextFunction } from 'express';
import * as investigationsService from '../services/investigations.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { io } from '../app';
import { getRoomActiveUsers } from '../sockets';

export async function getInvestigations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, priority, search } = req.query;
    const items = await investigationsService.getInvestigations({
      status: status ? String(status) : undefined,
      priority: priority ? String(priority) : undefined,
      search: search ? String(search) : undefined,
    });
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getInvestigation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await investigationsService.getInvestigationById(String(req.params.id));
    if (!item) {
      sendError(res, 'Investigation not found', 404);
      return;
    }
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createInvestigation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const creatorName = req.user?.name || req.user?.email || 'Investigator';
    const item = await investigationsService.createInvestigation(req.body, creatorName);
    // Broadcast real-time notification to all connected clients
    io.emit('investigation:created', {
      id: item.id,
      title: item.title,
      createdBy: creatorName,
      priority: item.priority,
      createdAt: item.createdAt,
    });
    sendSuccess(res, item, 201, 'Investigation created successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create investigation', 400);
  }
}

export async function updateInvestigation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await investigationsService.updateInvestigation(String(req.params.id), req.body);
    if (!item) {
      sendError(res, 'Investigation not found', 404);
      return;
    }
    // Broadcast status update globally to all connected dashboards and rooms
    io.emit('investigation:status-updated', {
      investigationId: item.id,
      id: item.id,
      status: item.status,
      priority: item.priority,
      updatedBy: req.user?.name || req.user?.email || 'Investigator',
    });
    sendSuccess(res, item, 200, 'Investigation updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteInvestigation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const success = await investigationsService.deleteInvestigation(String(req.params.id));
    if (!success) {
      sendError(res, 'Investigation not found', 404);
      return;
    }
    sendSuccess(res, { deleted: true }, 200, 'Investigation deleted successfully');
  } catch (err) {
    next(err);
  }
}

export async function getFindings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const findings = await investigationsService.getFindingsForInvestigation(String(req.params.id));
    sendSuccess(res, findings);
  } catch (err) {
    next(err);
  }
}

export async function createFinding(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const creatorName = req.user?.name || req.user?.email || 'Investigator';
    const finding = await investigationsService.createFindingForInvestigation(
      String(req.params.id),
      req.body,
      creatorName
    );
    sendSuccess(res, finding, 201, 'Finding linked successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create finding', 400);
  }
}

export async function getNotes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const notes = await investigationsService.getNotesForInvestigation(String(req.params.id));
    sendSuccess(res, notes);
  } catch (err) {
    next(err);
  }
}

export async function createNote(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authorId = req.user?.userId || 'usr-001';
    const authorName = req.user?.name || req.user?.email || 'Investigator';
    const note = await investigationsService.createNoteForInvestigation(
      String(req.params.id),
      req.body,
      authorId,
      authorName
    );
    sendSuccess(res, note, 201, 'Note created successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create note', 400);
  }
}

export async function getInvestigationMembers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const members = getRoomActiveUsers(id);
    sendSuccess(res, members);
  } catch (err) {
    next(err);
  }
}
