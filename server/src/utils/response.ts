import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  res.status(statusCode).json({ success: true, data, message });
}

export function sendError(res: Response, error: string, statusCode = 500): void {
  res.status(statusCode).json({ success: false, error });
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number
): void {
  res.status(200).json({
    success: true,
    data,
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
}
