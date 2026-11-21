import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../errors/domain-errors.js';
import type { AuthenticatedRequest } from '../../features/users/types/auth.types.js';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (user?.role !== 'admin') {
      throw new ForbiddenError('Admin role required');
    }
    next();
  } catch (error) {
    next(error);
  }
}
