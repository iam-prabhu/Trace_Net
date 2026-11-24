import { Request, Response, NextFunction } from 'express';
import * as graphService from '../services/graph.service';
import { runGCNInference } from '../algorithms/machine-learning/gcn';
import { sendSuccess, sendError } from '../utils/response';

export async function getGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const graph = await graphService.getGraphData(req.query);
    sendSuccess(res, graph);
  } catch (err) {
    next(err);
  }
}

export async function getSubgraph(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accountIds, maxDepth, minAmount, maxAmount } = req.body;
    const ids = Array.isArray(accountIds)
      ? accountIds
      : accountIds
      ? [accountIds]
      : [];
    const depth = maxDepth !== undefined ? Number(maxDepth) : 2;
    const minAmt = minAmount !== undefined ? Number(minAmount) : undefined;
    const maxAmt = maxAmount !== undefined ? Number(maxAmount) : undefined;

    const subgraph = await graphService.getSubgraph(ids, depth, minAmt, maxAmt);
    sendSuccess(res, subgraph);
  } catch (err) {
    next(err);
  }
}

export async function getNeighbors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const nodeId = String(req.params.nodeId || req.params.id);
    const depth = req.query.depth ? Number(req.query.depth) : 1;
    const graph = await graphService.getNeighbors(nodeId, depth);
    sendSuccess(res, graph);
  } catch (err) {
    next(err);
  }
}

export async function traverse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const algorithm = (req.body.algorithm || 'BFS').toUpperCase();
    let result;
    if (algorithm === 'DFS') {
      result = await graphService.runDFS(req.body);
    } else {
      result = await graphService.runBFS(req.body);
    }
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function runBFS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await graphService.runBFS(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function runDFS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await graphService.runDFS(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function detectCycles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await graphService.detectCycles(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function detectCommunities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await graphService.detectCommunities(req.body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getStatistics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await graphService.getStatistics();
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function runGCN(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const threshold = req.body?.threshold !== undefined ? Number(req.body.threshold) : (req.query?.threshold ? Number(req.query.threshold) : 0.75);
    const dropout = req.body?.dropout !== undefined ? Number(req.body.dropout) : 0.1;
    const result = runGCNInference({ threshold, dropout });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
