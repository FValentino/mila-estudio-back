import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../../shared/errors/domain-errors.js';
import { errorHandler } from '../../../shared/http/error-response.js';
import { getProfessional, replaceProfessional } from '../services/professionals.services.js';
import { professionalsRouter } from './professionals.controller.js';

const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
vi.mock('../../../shared/config/env.js', () => ({ env: testEnv }));

vi.mock('../services/professionals.services.js', () => ({
  createProfessional: vi.fn(),
  getProfessional: vi.fn(),
  listProfessionals: vi.fn(),
  removeProfessional: vi.fn(),
  replaceProfessional: vi.fn(),
  updateProfessional: vi.fn(),
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

const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
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
    url: `/${PROFESSIONAL_ID}`,
    query: {},
    params: {},
    body,
    headers: { authorization: `Bearer ${jwt.sign({ sub: 'user-1', role: 'admin' }, testEnv.JWT_SECRET, { expiresIn: '1h' })}` },
  } as unknown as Request;
}

function createGetRequest(): Request {
  return {
    method: 'GET',
    url: `/${PROFESSIONAL_ID}`,
    query: {},
    params: {},
    body: {},
    headers: {},
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

describe('PUT /api/professionals/:id', () => {
  const validBody = { firstName: 'Ana', lastName: 'Pérez', areaId: AREA_ID };
  const dto = {
    id: PROFESSIONAL_ID,
    ...validBody,
    createdAt: '2026-11-19T09:00:00.000Z',
    updatedAt: '2026-11-19T09:00:00.000Z',
  };

  it('returns HTTP 200 with the replaced professional', async () => {
    vi.mocked(replaceProfessional).mockResolvedValue(dto);
    const { res, captured } = createResponse();
    const req = createRequest(validBody);

    professionalsRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(200);
    expect(captured.body).toEqual(dto);
    expect(replaceProfessional).toHaveBeenCalledWith(PROFESSIONAL_ID, validBody);
  });

  it('returns HTTP 400 for an invalid body', async () => {
    const { res, captured } = createResponse();
    const req = createRequest({ firstName: 'Ana', lastName: 'Pérez', areaId: 'not-a-uuid' });

    professionalsRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toMatchObject({ error: { message: 'Invalid request' } });
    expect(replaceProfessional).not.toHaveBeenCalled();
  });
});

describe('GET /api/professionals/:id error forwarding', () => {
  it('forwards NotFoundError as HTTP 404 with the standard envelope', async () => {
    const error = new NotFoundError(`Professional with id ${PROFESSIONAL_ID} was not found`);
    vi.mocked(getProfessional).mockRejectedValue(error);
    const { res, captured } = createResponse();
    const req = createGetRequest();
    const next = vi.fn((thrown: unknown) => {
      errorHandler(thrown, req, res, () => {});
    }) as NextFunction;

    professionalsRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
    expect(captured.statusCode).toBe(404);
    expect(captured.body).toEqual({ error: { message: error.message, details: [] } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
  });

  it('forwards unexpected errors as HTTP 500 without leaking the stack', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('boom');
    vi.mocked(getProfessional).mockRejectedValue(error);
    const { res, captured } = createResponse();
    const req = createGetRequest();
    const next = vi.fn((thrown: unknown) => {
      errorHandler(thrown, req, res, () => {});
    }) as NextFunction;

    professionalsRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
    expect(captured.statusCode).toBe(500);
    expect(captured.body).toEqual({ error: { message: 'Internal server error', details: [] } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
    expect(consoleError).toHaveBeenCalledWith(error);
  });
});
