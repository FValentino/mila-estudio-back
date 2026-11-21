import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedRequest } from '../../features/users/types/auth.types.js';
import { errorHandler } from './error-response.js';
import { requireAdmin } from './require-admin.js';
import { requireAuth } from './require-auth.js';

const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
vi.mock('../config/env.js', () => ({ env: testEnv }));

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

interface FakeResponse {
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
  end(): FakeResponse;
}

function createResponse(): { res: Response; captured: CapturedResponse } {
  const captured: CapturedResponse = { statusCode: 200, body: undefined };
  const res: FakeResponse = {
    status(code) {
      captured.statusCode = code;
      return res;
    },
    json(body) {
      captured.body = body;
      return res;
    },
    end() {
      return res;
    },
  };
  return { res: res as unknown as Response, captured };
}

function createRequest(authorization?: string): Request {
  return {
    method: 'GET',
    url: '/',
    query: {},
    params: {},
    body: {},
    headers: authorization === undefined ? {} : { authorization },
  } as unknown as Request;
}

function tokenWith(claims: { sub: string; role: string }, expiresIn: NonNullable<SignOptions['expiresIn']>): string {
  return jwt.sign(claims, testEnv.JWT_SECRET, { expiresIn });
}

function errorForwardingNext(req: Request, res: Response): NextFunction {
  return ((error?: unknown) => {
    if (error !== undefined) {
      errorHandler(error, req, res, () => {});
    }
  }) as NextFunction;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireAuth', () => {
  it.each([
    ['missing', undefined, 'Authentication required'],
    ['malformed', 'Basic abc', 'Authentication required'],
    ['invalid', 'Bearer not-a-token', 'Invalid or expired token'],
    ['expired', `Bearer ${tokenWith({ sub: USER_ID, role: 'user' }, -10)}`, 'Invalid or expired token'],
  ])('rejects a %s token with HTTP 401', (_label, authorization, message) => {
    const { res, captured } = createResponse();
    const req = createRequest(authorization);
    const next = errorForwardingNext(req, res);

    requireAuth(req, res, next);

    expect(captured.statusCode).toBe(401);
    expect(captured.body).toEqual({ error: { message, details: [] } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
  });

  it('attaches the authenticated user and calls next without an error', () => {
    const req = createRequest(`Bearer ${tokenWith({ sub: USER_ID, role: 'admin' }, '1h')}`);
    const { res } = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect((req as AuthenticatedRequest).user).toEqual({ id: USER_ID, role: 'admin' });
  });

  it('rejects a token signed with HS384 even when the secret matches', () => {
    const token = jwt.sign(
      { sub: USER_ID, role: 'user' },
      testEnv.JWT_SECRET,
      { algorithm: 'HS384', expiresIn: '1h' },
    );
    const { res, captured } = createResponse();
    const req = createRequest(`Bearer ${token}`);

    requireAuth(req, res, errorForwardingNext(req, res));

    expect(captured.statusCode).toBe(401);
    expect(captured.body).toEqual({ error: { message: 'Invalid or expired token', details: [] } });
  });

  it('rejects a valid signature with an unexpected role', () => {
    const { res, captured } = createResponse();
    const req = createRequest(`Bearer ${tokenWith({ sub: USER_ID, role: 'superuser' }, '1h')}`);

    requireAuth(req, res, errorForwardingNext(req, res));

    expect(captured.statusCode).toBe(401);
  });
});

describe('requireAdmin', () => {
  it.each(['user', undefined] as const)('rejects role %s with HTTP 403', (role) => {
    const { res, captured } = createResponse();
    const req = createRequest();
    if (role !== undefined) {
      (req as AuthenticatedRequest).user = { id: USER_ID, role };
    }

    requireAdmin(req, res, errorForwardingNext(req, res));

    expect(captured.statusCode).toBe(403);
    expect(captured.body).toEqual({ error: { message: 'Admin role required', details: [] } });
  });

  it('calls next without an error for an admin user', () => {
    const { res, captured } = createResponse();
    const req = createRequest();
    (req as AuthenticatedRequest).user = { id: USER_ID, role: 'admin' };
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(captured.statusCode).toBe(200);
  });
});
