import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/http/error-response.js';
import { replaceArea } from '../services/areas.services.js';
import { areasRouter } from './areas.controller.js';

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
