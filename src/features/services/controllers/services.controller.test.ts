import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/http/error-response.js';
import { replaceService } from '../services/services.services.js';
import { servicesRouter } from './services.controller.js';

const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
vi.mock('../../../shared/config/env.js', () => ({ env: testEnv }));

vi.mock('../services/services.services.js', () => ({
  createService: vi.fn(),
  getService: vi.fn(),
  listServices: vi.fn(),
  removeService: vi.fn(),
  replaceService: vi.fn(),
  updateService: vi.fn(),
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

const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
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
    url: `/${SERVICE_ID}`,
    query: {},
    params: {},
    body,
    headers: { authorization: `Bearer ${jwt.sign({ sub: 'user-1', role: 'admin' }, testEnv.JWT_SECRET, { expiresIn: '1h' })}` },
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

describe('PUT /api/services/:id', () => {
  const validBody = { name: 'Manicuría básica', durationMinutes: 45, price: 1500, areaId: AREA_ID };
  const dto = {
    id: SERVICE_ID,
    ...validBody,
    createdAt: '2026-11-19T09:00:00.000Z',
    updatedAt: '2026-11-19T09:00:00.000Z',
  };

  it('returns HTTP 200 with the replaced service', async () => {
    vi.mocked(replaceService).mockResolvedValue(dto);
    const { res, captured } = createResponse();
    const req = createRequest(validBody);

    servicesRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(200);
    expect(captured.body).toEqual(dto);
    expect(replaceService).toHaveBeenCalledWith(SERVICE_ID, validBody);
  });

  it.each([-1, 1e12, 1500.129])('returns HTTP 400 without a stack trace for price %p', async (price) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { res, captured } = createResponse();
    const req = createRequest({ ...validBody, price });

    servicesRouter(req, res, nextFor(req, res));
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toMatchObject({ error: { message: 'Invalid request' } });
    expect(JSON.stringify(captured.body)).not.toContain('stack');
    expect(consoleError).not.toHaveBeenCalled();
    expect(replaceService).not.toHaveBeenCalled();
  });
});
