import type { NextFunction, Request, Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../errors/domain-errors.js';
import { errorHandler } from './error-response.js';

const next: NextFunction = () => undefined;

function setup(): { res: Response; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const status = vi.fn();
  const json = vi.fn();
  const res = { status, json } as unknown as Response;
  status.mockReturnValue(res);
  return { res, status, json };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorHandler', () => {
  it('preserves domain errors', () => {
    const { res, status, json } = setup();
    errorHandler(new ConflictError('busy slot'), {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: { message: 'busy slot', details: [] } });
  });

  it('maps postgres foreign key and unique violations to 409', () => {
    const foreignKey = setup();
    errorHandler({ code: '23503' }, {} as Request, foreignKey.res, next);
    expect(foreignKey.status).toHaveBeenCalledWith(409);

    const unique = setup();
    errorHandler({ code: '23505' }, {} as Request, unique.res, next);
    expect(unique.status).toHaveBeenCalledWith(409);
  });

  it('maps malformed JSON transport errors to 400 without a stack trace', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { res, status } = setup();
    errorHandler({ status: 400, type: 'entity.parse.failed' }, {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs unexpected errors as 500', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { res, status } = setup();
    errorHandler(new Error('boom'), {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(consoleError).toHaveBeenCalled();
  });
});
