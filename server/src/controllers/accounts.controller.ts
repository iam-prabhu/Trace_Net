import { Request, Response, NextFunction } from 'express';
import * as accountsService from '../services/accounts.service';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { io } from '../app';

export async function getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, search, accountType, status, isFlagged, minRisk, maxRisk, sortBy, sortOrder } =
      req.query;

    const result = await accountsService.getAccounts({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search: search ? String(search) : undefined,
      accountType: accountType ? String(accountType) : undefined,
      status: status ? String(status) : undefined,
      isFlagged: isFlagged !== undefined ? isFlagged === 'true' : undefined,
      minRisk: minRisk ? Number(minRisk) : undefined,
      maxRisk: maxRisk ? Number(maxRisk) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    sendPaginated(res, result.accounts, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
}

export async function getAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountId = String(req.params.accountId || req.params.id);
    const detail = await accountsService.getAccountById(accountId);
    if (!detail) {
      sendError(res, `Account not found: ${accountId}`, 404);
      return;
    }
    sendSuccess(res, detail);
  } catch (err) {
    next(err);
  }
}

export async function getAccountTransactions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const accountId = String(req.params.accountId || req.params.id);
    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
    const direction = (req.query.direction as any) || 'BOTH';
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const result = await accountsService.getAccountTransactions(
      accountId,
      direction,
      page,
      pageSize,
      startDate,
      endDate
    );

    sendPaginated(res, result.transactions, result.total, page, pageSize);
  } catch (err) {
    next(err);
  }
}

export async function getAccountNeighbors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const accountId = String(req.params.accountId || req.params.id);
    const depth = req.query.depth ? Number(req.query.depth) : 1;
    const graph = await accountsService.getAccountNeighbors(accountId, depth);
    sendSuccess(res, graph);
  } catch (err) {
    next(err);
  }
}

export async function createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await accountsService.createAccount(req.body);
    sendSuccess(res, account, 201, 'Account created successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountId = String(req.params.accountId || req.params.id);
    const updated = await accountsService.updateAccount(accountId, req.body);
    if (!updated) {
      sendError(res, `Account not found: ${accountId}`, 404);
      return;
    }
    try {
      io.emit('account:updated', updated);
      io.emit('graph:node-updated', updated);
    } catch {
      // ignore socket emit error
    }
    sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
