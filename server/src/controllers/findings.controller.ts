import { Response, NextFunction } from 'express';
import * as findingsService from '../services/findings.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getFindings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const investigationId = req.query.investigationId ? String(req.query.investigationId) : undefined;
    const items = await findingsService.getFindings(investigationId);
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getFinding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await findingsService.getFindingById(String(req.params.id));
    if (!item) {
      sendError(res, 'Finding not found', 404);
      return;
    }
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createFinding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const creatorName = req.user?.name || req.user?.email || 'Investigator';
    const item = await findingsService.createFinding(req.body, creatorName);
    sendSuccess(res, item, 201, 'Finding created successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to create finding', 400);
  }
}

export async function updateFinding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await findingsService.updateFinding(String(req.params.id), req.body);
    if (!item) {
      sendError(res, 'Finding not found', 404);
      return;
    }
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deleteFinding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const success = await findingsService.deleteFinding(String(req.params.id));
    if (!success) {
      sendError(res, 'Finding not found', 404);
      return;
    }
    sendSuccess(res, { deleted: true }, 200, 'Finding deleted successfully');
  } catch (err) {
    next(err);
  }
}
