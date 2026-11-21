import type { Request } from 'express';
import type { UserRole } from './user.types.js';

export interface JwtClaims {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export type AuthenticatedRequest = Request & { user: AuthenticatedUser };
