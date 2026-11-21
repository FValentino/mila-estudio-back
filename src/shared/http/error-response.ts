import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../errors/domain-errors.js';

interface ErrorResponseBody {
  error: {
    message: string;
    details: readonly string[];
  };
}

function errorCodeOf(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  const code: unknown = error.code;
  return typeof code === 'string' ? code : undefined;
}

function transportStatusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return undefined;
  }
  const status: unknown = error.status;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details: readonly string[] = [],
): void {
  const body: ErrorResponseBody = { error: { message, details } };
  res.status(statusCode).json(body);
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof DomainError) {
    sendError(res, error.statusCode, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path === '' ? issue.message : `${path}: ${issue.message}`;
    });
    sendError(res, 400, 'Invalid request', details);
    return;
  }

  const code = errorCodeOf(error);
  if (code === '23503' || code === '23505') {
    const message = code === '23503' ? 'Referenced resource is in use' : 'Resource already exists';
    sendError(res, 409, message, [code]);
    return;
  }

  if (transportStatusOf(error) !== undefined) {
    sendError(res, 400, 'Invalid request');
    return;
  }

  console.error(error);
  sendError(res, 500, 'Internal server error');
}
