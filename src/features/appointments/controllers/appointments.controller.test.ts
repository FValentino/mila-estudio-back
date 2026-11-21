import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/http/error-response.js';
import { replaceAppointment } from '../services/appointments.services.js';
import { AppointmentStatus } from '../types/appointment.types.js';
import { appointmentsRouter } from './appointments.controller.js';

const testEnv = vi.hoisted(() => ({
  JWT_SECRET: 'test-jwt-secret',
  TIMEZONE: 'America/Argentina/Buenos_Aires',
}));
vi.mock('../../../shared/config/env.js', () => ({ env: testEnv }));
vi.mock('../services/appointments.services.js', () => ({
  createAppointment: vi.fn(),
  getAppointment: vi.fn(),
  listAppointments: vi.fn(),
  removeAppointment: vi.fn(),
  replaceAppointment: vi.fn(),
  updateAppointmentStatus: vi.fn(),
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

const APPOINTMENT_ID = '44444444-4444-4444-8444-444444444444';
const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const START = '2026-11-20T10:00:00.000Z';

function createRequest(url: string, body: unknown, method: string): Request {
  return {
    method,
    url,
    query: {},
    params: {},
    body,
    headers: { authorization: `Bearer ${jwt.sign({ sub: 'user-1', role: 'admin' }, testEnv.JWT_SECRET, { expiresIn: '1h' })}` },
  } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/appointments/:id', () => {
  const validBody = {
    professionalId: PROFESSIONAL_ID,
    serviceId: SERVICE_ID,
    start: START,
    clientName: 'Ana Pérez',
    clientPhone: '+54 9 11 5555 5555',
    status: 'confirmed',
  };
  const dto = {
    id: APPOINTMENT_ID,
    ...validBody,
    status: AppointmentStatus.CONFIRMED,
    endAt: '2026-11-20T10:45:00.000Z',
    clientEmail: null,
    notes: null,
    createdAt: START,
    updatedAt: START,
  };

  it('returns HTTP 200 with the replaced appointment', async () => {
    vi.mocked(replaceAppointment).mockResolvedValue(dto);
    const { res, captured } = createResponse();
    const req = createRequest(`/${APPOINTMENT_ID}`, validBody, 'PUT');
    const next = ((error?: unknown) => {
      if (error !== undefined) {
        errorHandler(error, req, res, () => {});
      }
    }) as NextFunction;

    appointmentsRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(200);
    expect(captured.body).toEqual(dto);
    expect(replaceAppointment).toHaveBeenCalledWith(APPOINTMENT_ID, validBody);
  });

  it('returns HTTP 400 for an invalid body', async () => {
    const { res, captured } = createResponse();
    const req = createRequest(`/${APPOINTMENT_ID}`, { start: 'not-a-date' }, 'PUT');
    const next = ((error?: unknown) => {
      if (error !== undefined) {
        errorHandler(error, req, res, () => {});
      }
    }) as NextFunction;

    appointmentsRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toMatchObject({ error: { message: 'Invalid request' } });
    expect(replaceAppointment).not.toHaveBeenCalled();
  });
});

describe('GET /api/appointments with an invalid date', () => {
  it('returns HTTP 400 with the standard error envelope', async () => {
    const { res, captured } = createResponse();
    const req = {
      method: 'GET',
      url: '/?date=2026-02-30',
      query: { date: '2026-02-30' },
      params: {},
      body: {},
      headers: {},
    } as unknown as Request;
    const next = ((error?: unknown) => {
      if (error === undefined) {
        throw new Error('Router did not handle the request');
      }
      errorHandler(error, req, res, () => {});
    }) as NextFunction;

    appointmentsRouter(req, res, next);
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(captured.statusCode).toBe(400);
    expect(captured.body).toEqual({
      error: { message: 'Invalid request', details: ['date: Invalid calendar date'] },
    });
  });
});
