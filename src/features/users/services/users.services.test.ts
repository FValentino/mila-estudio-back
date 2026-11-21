import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError, UnauthorizedError } from '../../../shared/errors/domain-errors.js';
import { User } from '../entities/user.entity.js';
import { create, existsByEmail, findByEmail } from '../repositories/users.repository.js';
import { loginUserSchema, registerUserSchema } from '../types/user.types.js';
import { loginUser, registerUser } from './users.services.js';

const testEnv = vi.hoisted(() => ({ JWT_SECRET: 'test-jwt-secret' }));
vi.mock('../../../shared/config/env.js', () => ({ env: testEnv }));
vi.mock('../repositories/users.repository.js', () => ({
  create: vi.fn(),
  existsByEmail: vi.fn(),
  findByEmail: vi.fn(),
}));

const USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EMAIL = 'ana@example.com';
const PASSWORD = 'correct-password';

function makeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = USER_ID;
  user.email = EMAIL;
  user.passwordHash = 'stored-hash';
  user.role = 'user';
  user.createdAt = new Date('2026-11-21T00:00:00.000Z');
  user.updatedAt = new Date('2026-11-21T00:00:00.000Z');
  return Object.assign(user, overrides);
}

function persistUser(user: User): User {
  user.id = USER_ID;
  user.createdAt = new Date('2026-11-21T00:00:00.000Z');
  user.updatedAt = new Date('2026-11-21T00:00:00.000Z');
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerUser', () => {
  it('stores a bcrypt hash instead of the plaintext password', async () => {
    vi.mocked(existsByEmail).mockResolvedValue(false);
    vi.mocked(create).mockImplementation(async (user) => persistUser(user));

    const dto = await registerUser({ email: EMAIL, password: PASSWORD });

    const [createdUser] = vi.mocked(create).mock.calls[0] ?? [];
    if (!createdUser) {
      throw new Error('create was not called');
    }
    expect(createdUser.passwordHash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, createdUser.passwordHash)).toBe(true);
    expect(dto).not.toHaveProperty('passwordHash');
    expect(dto).toMatchObject({ id: USER_ID, email: EMAIL, role: 'user' });
  });

  it('throws ConflictError when the email already exists', async () => {
    vi.mocked(existsByEmail).mockResolvedValue(true);

    await expect(registerUser({ email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(ConflictError);
    expect(create).not.toHaveBeenCalled();
  });

  it('normalizes the email before checking and persisting it', async () => {
    vi.mocked(existsByEmail)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    vi.mocked(create).mockImplementation(async (user) => persistUser(user));

    const firstInput = registerUserSchema.parse({ email: ' ANA@EXAMPLE.COM ', password: PASSWORD });
    const secondInput = registerUserSchema.parse({ email: 'Ana@Example.com', password: PASSWORD });

    await registerUser(firstInput);
    await expect(registerUser(secondInput)).rejects.toBeInstanceOf(ConflictError);

    expect(existsByEmail).toHaveBeenNthCalledWith(1, EMAIL);
    expect(existsByEmail).toHaveBeenNthCalledWith(2, EMAIL);
    expect(create).toHaveBeenCalledTimes(1);

    const [createdUser] = vi.mocked(create).mock.calls[0] ?? [];
    if (!createdUser) {
      throw new Error('create was not called');
    }
    expect(createdUser.email).toBe(EMAIL);
  });
});

describe('loginUser', () => {
  it('throws UnauthorizedError when the email is unknown', async () => {
    vi.mocked(findByEmail).mockResolvedValue(null);

    await expect(loginUser({ email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('normalizes the email before looking up the user', async () => {
    vi.mocked(findByEmail).mockImplementation(async (email) => (
      email === EMAIL ? makeUser({ passwordHash: await bcrypt.hash(PASSWORD, 10) }) : null
    ));

    const input = loginUserSchema.parse({ email: ' ANA@EXAMPLE.COM ', password: PASSWORD });
    const { token } = await loginUser(input);

    expect(findByEmail).toHaveBeenCalledWith(EMAIL);
    expect(jwt.verify(token, testEnv.JWT_SECRET)).toMatchObject({ sub: USER_ID });
  });

  it('throws UnauthorizedError when the password does not match', async () => {
    vi.mocked(findByEmail).mockResolvedValue(makeUser({ passwordHash: await bcrypt.hash(PASSWORD, 10) }));

    await expect(loginUser({ email: EMAIL, password: 'wrong-password' })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('signs a token with only sub and role as application claims', async () => {
    const user = makeUser({ role: 'admin', passwordHash: await bcrypt.hash(PASSWORD, 10) });
    vi.mocked(findByEmail).mockResolvedValue(user);

    const { token } = await loginUser({ email: EMAIL, password: PASSWORD });
    const payload = jwt.verify(token, testEnv.JWT_SECRET);

    if (typeof payload === 'string') {
      throw new Error('Expected an object payload');
    }
    expect(payload).toMatchObject({ sub: USER_ID, role: 'admin' });
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('password');
    expect(payload).not.toHaveProperty('passwordHash');
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'role', 'sub']);
  });

  it('expires the token after 7 days', async () => {
    vi.mocked(findByEmail).mockResolvedValue(makeUser({ passwordHash: await bcrypt.hash(PASSWORD, 10) }));

    const { token } = await loginUser({ email: EMAIL, password: PASSWORD });
    const payload = jwt.decode(token);

    if (
      typeof payload !== 'object'
      || payload === null
      || typeof payload.exp !== 'number'
      || typeof payload.iat !== 'number'
    ) {
      throw new Error('Expected a token with exp and iat claims');
    }

    expect(payload.exp - payload.iat).toBe(7 * 24 * 3600);
  });
});
