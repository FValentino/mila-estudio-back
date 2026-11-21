import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '../../../shared/errors/domain-errors.js';
import { errorHandler } from '../../../shared/http/error-response.js';
import { authRouter } from './auth.controller.js';
import { loginUser, registerUser } from '../services/users.services.js';
import type { UserDto } from '../types/user.types.js';

interface CapturedHandler {
  (req: unknown, res: unknown, next: unknown): unknown;
}

interface CapturedRoute {
  method: string;
  path: string;
  handler: CapturedHandler;
}

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

interface FakeResponse {
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
  end(): FakeResponse;
}

const state = vi.hoisted(() => ({
  routes: [] as CapturedRoute[],
}));

vi.mock('express', () => {
  const createRouter = () => {
    const router = {
      post(path: string, ...handlers: unknown[]) {
        const handler = handlers[handlers.length - 1];
        if (typeof handler === 'function') {
          state.routes.push({ method: 'POST', path, handler: handler as CapturedHandler });
        }
        return router;
      },
    };
    return router;
  };
  const express = { Router: createRouter };
  return { default: express, Router: createRouter };
});

vi.mock('../services/users.services.js', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_DTO: UserDto = {
  id: USER_ID,
  email: 'ana@example.com',
  role: 'user',
  createdAt: '2026-11-21T00:00:00.000Z',
  updatedAt: '2026-11-21T00:00:00.000Z',
};

void authRouter;

function handlerFor(path: string): CapturedHandler {
  const route = state.routes.find((candidate) => candidate.path === path);
  if (!route) {
    throw new Error(`No handler captured for ${path}`);
  }
  return route.handler;
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

function createRequest(path: string, body: unknown): Request {
  return { method: 'POST', url: path, query: {}, params: {}, body, headers: {} } as unknown as Request;
}

function createNext(req: Request, res: Response) {
  return vi.fn((error?: unknown) => {
    if (error !== undefined) {
      errorHandler(error, req, res, () => {});
    }
  });
}

async function dispatch(path: string, body: unknown): Promise<{
  captured: CapturedResponse;
  next: ReturnType<typeof createNext>;
}> {
  const { res, captured } = createResponse();
  const req = createRequest(path, body);
  const next = createNext(req, res);
  await handlerFor(path)(req, res, next);
  return { captured, next };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('returns HTTP 201 with the user DTO and no passwordHash', async () => {
    vi.mocked(registerUser).mockResolvedValue(USER_DTO);

    const { captured } = await dispatch('/register', { email: USER_DTO.email, password: 'correct-password' });

    expect(captured.statusCode).toBe(201);
    expect(captured.body).toEqual(USER_DTO);
    expect(JSON.stringify(captured.body)).not.toContain('passwordHash');
    expect(registerUser).toHaveBeenCalledWith({ email: USER_DTO.email, password: 'correct-password' });
  });
});

describe('POST /api/auth/login', () => {
  it('returns HTTP 200 with the token', async () => {
    vi.mocked(loginUser).mockResolvedValue({ token: 'signed-token' });

    const { captured } = await dispatch('/login', { email: USER_DTO.email, password: 'correct-password' });

    expect(captured.statusCode).toBe(200);
    expect(captured.body).toEqual({ token: 'signed-token' });
  });

  it('maps invalid credentials to HTTP 401 without a stack trace', async () => {
    const error = new UnauthorizedError('Invalid credentials');
    vi.mocked(loginUser).mockRejectedValue(error);

    const { captured, next } = await dispatch('/login', { email: USER_DTO.email, password: 'wrong-password' });

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
    expect(captured.statusCode).toBe(401);
    expect(captured.body).toEqual({ error: { message: 'Invalid credentials', details: [] } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
  });
});

describe('auth route registration', () => {
  it('registers both POST endpoints exactly once', () => {
    expect(state.routes.map((route) => `${route.method} ${route.path}`)).toEqual([
      'POST /register',
      'POST /login',
    ]);
  });
});
