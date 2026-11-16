import { Response, NextFunction } from 'express';
import * as datasetsService from '../services/datasets.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

export async function listDatasets(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await datasetsService.listDatasets();
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await datasetsService.getDatasetById(String(req.params.id));
    if (!item) {
      sendError(res, 'Dataset not found', 404);
      return;
    }
    sendSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function importDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const uploadedBy = req.user?.name || req.user?.email || 'Investigator';
    const csvString = req.body.csvString || req.body.csvData || (typeof req.body === 'string' ? req.body : undefined);
    const transactions = req.body.transactions;
    const fileName = req.body.fileName || (req.file ? req.file.originalname : 'uploaded.csv');

    if (!req.file && !csvString && !transactions) {
      sendError(res, 'Please provide a CSV file, csvString, or transactions array', 400);
      return;
    }

    const result = await datasetsService.importDataset({
      file: req.file,
      csvString,
      transactions,
      fileName,
      uploadedBy,
    });

    sendSuccess(res, result, 201, 'Dataset imported successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Dataset import failed', 400);
  }
}

export async function uploadDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  return importDataset(req, res, next);
}

export async function processDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await datasetsService.processDataset(String(req.params.id));
    if (!result) {
      sendError(res, 'Dataset not found', 404);
      return;
    }
    sendSuccess(res, result, 200, 'Dataset processed successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteDataset(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const success = await datasetsService.deleteDataset(String(req.params.id));
    if (!success) {
      sendError(res, 'Dataset not found', 404);
      return;
    }
    sendSuccess(res, { deleted: true }, 200, 'Dataset deleted successfully');
  } catch (err) {
    next(err);
  }
}
