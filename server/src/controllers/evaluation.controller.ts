import { Request, Response, NextFunction } from 'express';
import * as evaluationService from '../services/evaluation.service';
import { sendSuccess } from '../utils/response';

export async function runBenchmark(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await evaluationService.runComprehensiveBenchmark();
    sendSuccess(res, result, 200, 'Benchmark completed successfully');
  } catch (err) {
    next(err);
  }
}

export async function getResults(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const results = await evaluationService.getCachedBenchmarkResults();
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}

export async function evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await evaluationService.evaluateModel(String(req.params.investigationId));
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function crossValidate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await evaluationService.runComprehensiveBenchmark();
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
