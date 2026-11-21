import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../shared/http/error-response.js';
import { appointmentsRouter } from './appointments.controller.js';

vi.mock('../../../shared/config/env.js', () => ({ env: { TIMEZONE: 'America/Argentina/Buenos_Aires' } }));
vi.mock('../repositories/appointments.repository.js', () => ({
  withAppointmentTransaction: vi.fn(),
  findAppointments: vi.fn(),
  findAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
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
