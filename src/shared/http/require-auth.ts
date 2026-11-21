import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/domain-errors.js';
import type { AuthenticatedRequest, JwtClaims } from '../../features/users/types/auth.types.js';

const BEARER_PREFIX = 'Bearer ';

function readBearerToken(req: Request): string {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError('Authentication required');
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (token === '') {
    throw new UnauthorizedError('Authentication required');
  }
  return token;
}

function verifyClaims(token: string): JwtClaims {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  if (
    typeof payload === 'string'
    || typeof payload.sub !== 'string'
    || (payload.role !== 'user' && payload.role !== 'admin')
  ) {
    throw new UnauthorizedError('Invalid token');
  }

  return { sub: payload.sub, role: payload.role };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const claims = verifyClaims(readBearerToken(req));
    (req as AuthenticatedRequest).user = { id: claims.sub, role: claims.role };
    next();
  } catch (error) {
    next(error);
  }
}
