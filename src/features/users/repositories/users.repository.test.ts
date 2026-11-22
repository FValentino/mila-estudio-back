import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { FindOperator } from 'typeorm';
import type { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loginUserSchema } from '../types/user.types.js';
import { loginUser } from '../services/users.services.js';

const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
const repositoryMock = vi.hoisted(() => ({ findOne: vi.fn() }));

vi.mock('../../../shared/config/env.js', () => ({ env: testEnv }));
vi.mock('../../../shared/database/data-source.js', () => ({
  dataSource: { getRepository: () => ({ findOne: repositoryMock.findOne }) },
}));

interface FindOneOptions {
  where: FindOptionsWhere<{ email: string }>;
}

function rawCondition(where: FindOptionsWhere<{ email: string }>): FindOperator<string> {
  const condition = where.email;
  if (!(condition instanceof FindOperator)) {
    throw new Error('findByEmail must use a FindOperator');
  }
  return condition;
}

beforeEach(() => {
  repositoryMock.findOne.mockReset();
});

describe('findByEmail case-insensitive lookup', () => {
  it('queries with lower(email) and normalized parameter', async () => {
    let capturedWhere: FindOptionsWhere<{ email: string }> | undefined;
    repositoryMock.findOne.mockImplementation((options: FindOneOptions) => {
      capturedWhere = options.where;
      return Promise.resolve(null);
    });

    const { findByEmail } = await import('./users.repository.js');
    await findByEmail(' ADMIN@X.COM ');

    if (capturedWhere === undefined) {
      throw new Error('findOne was not called');
    }
    const condition = rawCondition(capturedWhere);
    const sql = condition.getSql?.('"user"."email"') ?? '';

    expect(condition.type).toBe('raw');
    expect(sql).toContain('lower(');
    expect(sql).toContain('= :email');
    expect(condition.objectLiteralParameters).toMatchObject({ email: 'admin@x.com' });
  });

  it('logs in with ADMIN@X.COM when the stored email is admin@x.com', async () => {
    const storedEmail = 'admin@x.com';
    const password = 'correct-password';
    const user = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      email: storedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin' as const,
    };

    repositoryMock.findOne.mockImplementation((options: FindOneOptions) => {
      const condition = rawCondition(options.where);
      const parameters = condition.objectLiteralParameters as ObjectLiteral | undefined;
      return Promise.resolve(parameters?.email === storedEmail ? user : null);
    });

    const input = loginUserSchema.parse({ email: 'ADMIN@X.COM', password });
    const { token } = await loginUser(input);
    const payload = jwt.verify(token, testEnv.JWT_SECRET);

    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Expected an object payload');
    }
    expect(payload).toMatchObject({ sub: user.id, role: 'admin' });
  });
});
