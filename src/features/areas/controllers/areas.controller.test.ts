import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../shared/errors/domain-errors.js';
import { errorHandler } from '../../../shared/http/error-response.js';
import { getArea, removeArea, replaceArea } from '../services/areas.services.js';
import { areasRouter } from './areas.controller.js';

const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
vi.mock('../../../shared/config/env.js', () => ({ env: testEnv }));

vi.mock('../services/areas.services.js', () => ({
  createArea: vi.fn(),
  getArea: vi.fn(),
  listAreas: vi.fn(),
  removeArea: vi.fn(),
  replaceArea: vi.fn(),
  updateArea: vi.fn(),
}));

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

interface FakeResponse {
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
  end(): FakeResponse;
}

const AREA_ID = '11111111-1111-4111-8111-111111111111';

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

function createRequest(body: unknown): Request {
  return {
    method: 'PUT',
    url: `/${AREA_ID}`,
    query: {},
    params: {},
    body,
    headers: { authorization: `Bearer ${jwt.sign({ sub: 'user-1', role: 'admin' }, testEnv.JWT_SECRET, { expiresIn: '1h' })}` },
  } as unknown as Request;
}

function createGetRequest(): Request {
  return {
    method: 'GET',
    url: `/${AREA_ID}`,
    query: {},
    params: {},
    body: {},
    headers: {},
  } as unknown as Request;
}


function createDeleteRequest(role?: 'user' | 'admin'): Request {
  const headers = role === undefined
    ? {}
    : {
        authorization: `Bearer ${jwt.sign({ sub: 'user-1', role }, testEnv.JWT_SECRET, { expiresIn: '1h' })}`,
      };
  return {
    method: 'DELETE',
    url: `/${AREA_ID}`,
    query: {},
    params: {},
    body: {},
    headers,
  } as unknown as Request;
}

function nextFor(req: Request, res: Response): NextFunction {
  return ((error?: unknown) => {
    if (error !== undefined) {
      errorHandler(error, req, res, () => {});
    }
  }) as NextFunction;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PUT /api/areas/:id', () => {
  const validBody = { name: 'Manicuría', description: 'Cuidado de uñas' };
  const dto = {
    id: AREA_ID,
    ...validBody,
    createdAt: '2026-11-19T09:00:00.000Z',
    updatedAt: '2026-11-19T09:00:00.000Z',
  };

  it('returns HTTP 200 with the replaced area', async () => {
    vi.mocked(replaceArea).mockResolvedValue(dto);
    const { res, captured } = createResponse();
    const req = createRequest(validBody);

    areasRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(200);
    expect(captured.body).toEqual(dto);
    expect(replaceArea).toHaveBeenCalledWith(AREA_ID, validBody);
  });

  it('accepts a PUT without the optional description', async () => {
    const body = { name: 'Manicuría' };
    vi.mocked(replaceArea).mockResolvedValue({
      id: AREA_ID,
      ...body,
      description: null,
      createdAt: '2026-11-19T09:00:00.000Z',
      updatedAt: '2026-11-19T09:00:00.000Z',
    });
    const { res, captured } = createResponse();
    const req = createRequest(body);

    areasRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(200);
    expect(captured.body).toMatchObject({ description: null });
    expect(replaceArea).toHaveBeenCalledWith(AREA_ID, body);
  });

  it('returns HTTP 400 for an invalid body', async () => {
    const { res, captured } = createResponse();
    const req = createRequest({ name: '' });

    areasRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toMatchObject({ error: { message: 'Invalid request' } });
    expect(replaceArea).not.toHaveBeenCalled();
  });
});

describe('GET /api/areas/:id error forwarding', () => {
  it('forwards NotFoundError as HTTP 404 with the standard envelope', async () => {
    const error = new NotFoundError(`Area with id ${AREA_ID} was not found`);
    vi.mocked(getArea).mockRejectedValue(error);
    const { res, captured } = createResponse();
    const req = createGetRequest();
    const next = vi.fn((thrown: unknown) => {
      errorHandler(thrown, req, res, () => {});
    }) as NextFunction;

    areasRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
    expect(captured.statusCode).toBe(404);
    expect(captured.body).toEqual({ error: { message: error.message, details: [] } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
  });

  it('forwards unexpected errors as HTTP 500 without leaking the stack', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');
    vi.mocked(getArea).mockRejectedValue(error);
    const { res, captured } = createResponse();
    const req = createGetRequest();
    const next = vi.fn((thrown: unknown) => {
      errorHandler(thrown, req, res, () => {});
    }) as NextFunction;

    areasRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
    expect(captured.statusCode).toBe(500);
    expect(captured.body).toEqual({ error: { message: 'Internal server error', details: [] } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});

describe('DELETE /api/areas/:id authorization', () => {
  it('returns HTTP 401 before calling the service when no token is sent', async () => {
    const { res, captured } = createResponse();
    const req = createDeleteRequest();

    areasRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(401);
    expect(captured.body).toMatchObject({ error: { message: 'Authentication required', details: [] } });
    expect(removeArea).not.toHaveBeenCalled();
  });

  it('returns HTTP 403 for an authenticated non-admin user', async () => {
    const { res, captured } = createResponse();
    const req = createDeleteRequest('user');

    areasRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(403);
    expect(captured.body).toEqual({ error: { message: 'Admin role required', details: [] } });
    expect(removeArea).not.toHaveBeenCalled();
  });

  it('returns HTTP 204 for an admin token', async () => {
    vi.mocked(removeArea).mockResolvedValue(undefined);
    const { res, captured } = createResponse();
    const req = createDeleteRequest('admin');

    areasRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(204);
    expect(removeArea).toHaveBeenCalledWith(AREA_ID);
  });
});
