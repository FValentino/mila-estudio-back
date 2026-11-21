import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from './error-response.js';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Feature = 'areas' | 'professionals' | 'services' | 'appointments';
type Role = 'user' | 'admin';
interface CapturedRoute {
  feature: Feature;
  method: HttpMethod;
  path: string;
  middlewares: RequestHandler[];
  handler: RequestHandler;
}
interface RouteSpec {
  feature: Feature;
  method: HttpMethod;
  path: string;
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
  currentFeature: '' as Feature | '',
  routes: [] as CapturedRoute[],
}));
const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
vi.mock('../config/env.js', () => ({ env: testEnv }));
vi.mock('express', () => {
  function capture(method: HttpMethod, path: string, handlers: unknown[]): void {
    const handler = handlers[handlers.length - 1];
    if (typeof handler !== 'function') {
      return;
    }
    state.routes.push({
      feature: state.currentFeature as Feature,
      method,
      path,
      middlewares: handlers.slice(0, -1) as RequestHandler[],
      handler: handler as RequestHandler,
    });
  }
  function createRouter(): Record<string, unknown> {
    const router: Record<string, unknown> = {};
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      router[method.toLowerCase()] = (path: string, ...handlers: unknown[]) => {
        capture(method, path, handlers);
        return router;
      };
    }
    return router;
  }
  return { default: { Router: createRouter }, Router: createRouter };
});
vi.mock('../../features/areas/services/areas.services.js', () => ({
  createArea: vi.fn(),
  getArea: vi.fn(),
  listAreas: vi.fn(),
  removeArea: vi.fn(),
  replaceArea: vi.fn(),
  updateArea: vi.fn(),
}));
vi.mock('../../features/professionals/services/professionals.services.js', () => ({
  createProfessional: vi.fn(),
  getProfessional: vi.fn(),
  listProfessionals: vi.fn(),
  removeProfessional: vi.fn(),
  replaceProfessional: vi.fn(),
  updateProfessional: vi.fn(),
}));
vi.mock('../../features/services/services/services.services.js', () => ({
  createService: vi.fn(),
  getService: vi.fn(),
  listServices: vi.fn(),
  removeService: vi.fn(),
  replaceService: vi.fn(),
  updateService: vi.fn(),
}));
vi.mock('../../features/appointments/services/appointments.services.js', () => ({
  createAppointment: vi.fn(),
  getAppointment: vi.fn(),
  listAppointments: vi.fn(),
  removeAppointment: vi.fn(),
  replaceAppointment: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}));
import * as areasServices from '../../features/areas/services/areas.services.js';
import * as appointmentsServices from '../../features/appointments/services/appointments.services.js';
import * as professionalsServices from '../../features/professionals/services/professionals.services.js';
import * as servicesServices from '../../features/services/services/services.services.js';
const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const VALID_ID = '11111111-1111-4111-8111-111111111111';
const FEATURES: Feature[] = ['areas', 'professionals', 'services', 'appointments'];
const ROUTE_SPECS: RouteSpec[] = FEATURES.flatMap((feature) => {
  const patchPath = feature === 'appointments' ? '/:id/status' : '/:id';
  return [
    { feature, method: 'GET', path: '/' },
    { feature, method: 'GET', path: '/:id' },
    { feature, method: 'POST', path: '/' },
    { feature, method: 'PUT', path: '/:id' },
    { feature, method: 'PATCH', path: patchPath },
    { feature, method: 'DELETE', path: '/:id' },
  ];
});
const PROTECTED_ROUTE_SPECS = ROUTE_SPECS.filter((spec) => spec.method !== 'GET');
const DELETE_ROUTE_SPECS = ROUTE_SPECS.filter((spec) => spec.method === 'DELETE');
const deleteServices = {
  areas: areasServices.removeArea,
  professionals: professionalsServices.removeProfessional,
  services: servicesServices.removeService,
  appointments: appointmentsServices.removeAppointment,
};
const allServiceMocks = [
  ...Object.values(areasServices),
  ...Object.values(professionalsServices),
  ...Object.values(servicesServices),
  ...Object.values(appointmentsServices),
];
function label(spec: RouteSpec): string {
  return `${spec.feature.toUpperCase()} ${spec.method} ${spec.path}`;
}
function findRoute(spec: RouteSpec): CapturedRoute {
  const route = state.routes.find((candidate) => (
    candidate.feature === spec.feature
    && candidate.method === spec.method
    && candidate.path === spec.path
  ));
  if (route === undefined) {
    throw new Error(`No route captured for ${label(spec)}`);
  }
  return route;
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
function createRequest(method: HttpMethod, path: string, authorization?: string): Request {
  return {
    method,
    url: path,
    query: {},
    params: { id: VALID_ID },
    body: {},
    headers: authorization === undefined ? {} : { authorization },
  } as unknown as Request;
}
function tokenWith(role: Role): string {
  return jwt.sign({ sub: USER_ID, role }, testEnv.JWT_SECRET, { expiresIn: '1h' });
}
function runMiddlewares(
  middlewares: RequestHandler[],
  index: number,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const middleware = middlewares[index];
  if (middleware === undefined) {
    return;
  }
  middleware(req, res, ((error?: unknown) => {
    if (error !== undefined) {
      next(error);
      return;
    }
    runMiddlewares(middlewares, index + 1, req, res, next);
  }) as NextFunction);
}
async function dispatch(route: CapturedRoute, authorization?: string): Promise<CapturedResponse> {
  const { res, captured } = createResponse();
  const req = createRequest(route.method, route.path, authorization);
  let blocked = false;
  const next = ((error?: unknown) => {
    if (error !== undefined) {
      blocked = true;
      errorHandler(error, req, res, () => {});
    }
  }) as NextFunction;
  runMiddlewares(route.middlewares, 0, req, res, next);
  if (!blocked) {
    await route.handler(req, res, next);
  }
  return captured;
}
function expectNoServiceCalls(): void {
  for (const mock of allServiceMocks) {
    expect(mock).not.toHaveBeenCalled();
  }
}
beforeAll(async () => {
  state.currentFeature = 'areas';
  await import('../../features/areas/controllers/areas.controller.js');
  state.currentFeature = 'professionals';
  await import('../../features/professionals/controllers/professionals.controller.js');
  state.currentFeature = 'services';
  await import('../../features/services/controllers/services.controller.js');
  state.currentFeature = 'appointments';
  await import('../../features/appointments/controllers/appointments.controller.js');
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(areasServices.removeArea).mockResolvedValue(undefined);
  vi.mocked(professionalsServices.removeProfessional).mockResolvedValue(undefined);
  vi.mocked(servicesServices.removeService).mockResolvedValue(undefined);
  vi.mocked(appointmentsServices.removeAppointment).mockResolvedValue(undefined);
});
describe('protected controller routes', () => {
  it('registers 24 routes, 6 per feature, with 16 protected routes', () => {
    expect(state.routes).toHaveLength(24);
    for (const feature of FEATURES) {
      expect(state.routes.filter((route) => route.feature === feature)).toHaveLength(6);
      expect(state.routes.filter((route) => route.feature === feature && route.method !== 'GET')).toHaveLength(4);
    }
    expect(PROTECTED_ROUTE_SPECS).toHaveLength(16);
    for (const spec of PROTECTED_ROUTE_SPECS) {
      const route = findRoute(spec);
      expect(route.middlewares).toHaveLength(spec.method === 'DELETE' ? 2 : 1);
    }
  });
  it.each(PROTECTED_ROUTE_SPECS.map((spec) => [label(spec), spec] as const))(
    'rejects %s without a token with HTTP 401',
    async (_name, spec) => {
      const captured = await dispatch(findRoute(spec));
      expect(captured.statusCode).toBe(401);
      expect(captured.body).toEqual({ error: { message: 'Authentication required', details: [] } });
      expectNoServiceCalls();
    },
  );
  it.each(DELETE_ROUTE_SPECS.map((spec) => [label(spec), spec] as const))(
    'rejects %s for a user token with HTTP 403',
    async (_name, spec) => {
      const captured = await dispatch(findRoute(spec), `Bearer ${tokenWith('user')}`);
      expect(captured.statusCode).toBe(403);
      expect(captured.body).toEqual({ error: { message: 'Admin role required', details: [] } });
      expectNoServiceCalls();
    },
  );
  it.each(DELETE_ROUTE_SPECS.map((spec) => [label(spec), spec] as const))(
    'allows %s for an admin token and calls the service',
    async (_name, spec) => {
      const captured = await dispatch(findRoute(spec), `Bearer ${tokenWith('admin')}`);
      expect(captured.statusCode).toBe(204);
      expect(deleteServices[spec.feature]).toHaveBeenCalledWith(VALID_ID);
    },
  );
});
