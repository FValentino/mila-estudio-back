import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/domain-errors.js';
import { errorHandler } from '../../shared/http/error-response.js';
import { areasRouter } from '../../features/areas/controllers/areas.controller.js';
import { professionalsRouter } from '../../features/professionals/controllers/professionals.controller.js';
import { servicesRouter } from '../../features/services/controllers/services.controller.js';
import { appointmentsRouter } from '../../features/appointments/controllers/appointments.controller.js';

interface CapturedRoute {
  method: string;
  path: string;
  handler: (req: unknown, res: unknown, next: unknown) => unknown;
}

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

type ControllerName = 'areas' | 'professionals' | 'services' | 'appointments';

const ERROR_MESSAGE = 'Controlled service failure';
const AREA_ID = '11111111-1111-4111-8111-111111111111';
const PROFESSIONAL_ID = '22222222-2222-4222-8222-222222222222';
const SERVICE_ID = '33333333-3333-4333-8333-333333333333';
const ENTITY_ID = '44444444-4444-4444-8444-444444444444';

const state = vi.hoisted(() => ({
  failure: undefined as Error | undefined,
  routesByRouter: [] as CapturedRoute[][],
}));

vi.mock('../config/env.js', () => ({
  env: { JWT_SECRET: 'test-jwt-secret', TIMEZONE: 'America/Argentina/Buenos_Aires' },
}));

vi.mock('express', () => {
  const addRoute = (routes: CapturedRoute[], method: string, path: string, handlers: unknown[]): void => {
    const handler = handlers[handlers.length - 1];
    if (typeof handler === 'function') {
      routes.push({ method, path, handler: handler as CapturedRoute['handler'] });
    }
  };

  const createRouter = () => {
    const routes: CapturedRoute[] = [];
    const router = {
      get(path: string, ...handlers: unknown[]) {
        addRoute(routes, 'GET', path, handlers);
        return router;
      },
      post(path: string, ...handlers: unknown[]) {
        addRoute(routes, 'POST', path, handlers);
        return router;
      },
      put(path: string, ...handlers: unknown[]) {
        addRoute(routes, 'PUT', path, handlers);
        return router;
      },
      patch(path: string, ...handlers: unknown[]) {
        addRoute(routes, 'PATCH', path, handlers);
        return router;
      },
      delete(path: string, ...handlers: unknown[]) {
        addRoute(routes, 'DELETE', path, handlers);
        return router;
      },
    };
    state.routesByRouter.push(routes);
    return router;
  };

  const express = { Router: createRouter };
  return { default: express, Router: createRouter };
});

vi.mock('../../features/areas/services/areas.services.js', () => ({
  createArea: () => Promise.reject(state.failure),
  getArea: () => Promise.reject(state.failure),
  listAreas: () => Promise.reject(state.failure),
  removeArea: () => Promise.reject(state.failure),
  replaceArea: () => Promise.reject(state.failure),
  updateArea: () => Promise.reject(state.failure),
}));

vi.mock('../../features/professionals/services/professionals.services.js', () => ({
  createProfessional: () => Promise.reject(state.failure),
  getProfessional: () => Promise.reject(state.failure),
  listProfessionals: () => Promise.reject(state.failure),
  removeProfessional: () => Promise.reject(state.failure),
  replaceProfessional: () => Promise.reject(state.failure),
  updateProfessional: () => Promise.reject(state.failure),
}));

vi.mock('../../features/services/services/services.services.js', () => ({
  createService: () => Promise.reject(state.failure),
  getService: () => Promise.reject(state.failure),
  listServices: () => Promise.reject(state.failure),
  removeService: () => Promise.reject(state.failure),
  replaceService: () => Promise.reject(state.failure),
  updateService: () => Promise.reject(state.failure),
}));

vi.mock('../../features/appointments/services/appointments.services.js', () => ({
  createAppointment: () => Promise.reject(state.failure),
  getAppointment: () => Promise.reject(state.failure),
  listAppointments: () => Promise.reject(state.failure),
  removeAppointment: () => Promise.reject(state.failure),
  replaceAppointment: () => Promise.reject(state.failure),
  updateAppointmentStatus: () => Promise.reject(state.failure),
}));

const EXPECTED_ROUTES: Record<ControllerName, readonly string[]> = {
  areas: ['GET /', 'GET /:id', 'POST /', 'PATCH /:id', 'PUT /:id', 'DELETE /:id'],
  professionals: ['GET /', 'GET /:id', 'POST /', 'PATCH /:id', 'PUT /:id', 'DELETE /:id'],
  services: ['GET /', 'GET /:id', 'POST /', 'PATCH /:id', 'PUT /:id', 'DELETE /:id'],
  appointments: ['GET /', 'GET /:id', 'POST /', 'PUT /:id', 'PATCH /:id/status', 'DELETE /:id'],
};

const CONTROLLER_ORDER: readonly ControllerName[] = ['areas', 'professionals', 'services', 'appointments'];

void areasRouter;
void professionalsRouter;
void servicesRouter;
void appointmentsRouter;

const controllers = CONTROLLER_ORDER.map((name, index) => {
  const routes = state.routesByRouter[index];
  if (!routes) {
    throw new Error(`Missing captured router for ${name}`);
  }
  return { name, routes };
});

function signatureOf(route: CapturedRoute): string {
  return `${route.method} ${route.path}`;
}

function createRequest(): Request {
  return {
    method: 'GET',
    url: '/',
    params: { id: ENTITY_ID },
    query: { professionalId: PROFESSIONAL_ID, date: '2026-11-22' },
    body: {
      name: 'Manicuría',
      description: 'Cuidado de uñas',
      firstName: 'Ana',
      lastName: 'Pérez',
      areaId: AREA_ID,
      durationMinutes: 60,
      price: 1500,
      professionalId: PROFESSIONAL_ID,
      serviceId: SERVICE_ID,
      start: '2026-11-22T10:00:00.000+00:00',
      clientName: 'Cliente',
      clientPhone: '123456789',
      clientEmail: 'cliente@example.com',
      notes: 'Sin notas',
      status: 'confirmed',
    },
    headers: {},
  } as unknown as Request;
}

function createResponse(): { res: Response; captured: CapturedResponse } {
  const captured: CapturedResponse = { statusCode: 200, body: undefined };
  const res = {
    status(code: number) {
      captured.statusCode = code;
      return res;
    },
    json(body: unknown) {
      captured.body = body;
      return res;
    },
    end() {
      return res;
    },
  };
  return { res: res as unknown as Response, captured };
}

function createNext(req: Request, res: Response) {
  return vi.fn((error?: unknown) => {
    if (error !== undefined) {
      errorHandler(error, req, res, () => {});
    }
  });
}

beforeEach(() => {
  state.failure = new NotFoundError(ERROR_MESSAGE);
});

describe('controller error forwarding', () => {
  it('registers exactly 24 handlers, 6 per controller', () => {
    expect(state.routesByRouter).toHaveLength(4);
    expect(controllers.reduce((total, { routes }) => total + routes.length, 0)).toBe(24);

    for (const { name, routes } of controllers) {
      expect(routes, name).toHaveLength(6);
      expect(routes.map(signatureOf), name).toEqual(EXPECTED_ROUTES[name]);
    }
  });
});

for (const { name, routes } of controllers) {
  describe(`${name} controller`, () => {
    for (const route of routes) {
      it(`${route.method} ${route.path} forwards the service error through next`, async () => {
        const failure = state.failure;
        if (!failure) {
          throw new Error('Failure was not initialized');
        }

        const req = createRequest();
        const { res, captured } = createResponse();
        const next = createNext(req, res);

        await route.handler(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const [forwarded] = next.mock.calls[0] ?? [];
        expect(forwarded).toBeInstanceOf(Error);
        expect(forwarded).toBe(failure);
        expect(captured.statusCode).toBe(404);
        expect(captured.body).toEqual({ error: { message: ERROR_MESSAGE, details: [] } });
        expect(JSON.stringify(captured.body)).not.toContain('stack');
      });
    }
  });
}
