import bcrypt from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../../features/users/entities/user.entity.js';
import { seedAdmin } from './seed-admin.logic.js';

const EMAIL = 'admin@example.com';
const PASSWORD = 'admin-password';

function persist(user: User): User {
  user.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  return user;
}

describe('seedAdmin', () => {
  it('normalizes the email, assigns the admin role and hashes the password with bcrypt', async () => {
    const findByEmail = vi.fn<(email: string) => Promise<User | null>>().mockResolvedValue(null);
    const create = vi.fn<(user: User) => Promise<User>>().mockImplementation(async (user) => persist(user));

    const user = await seedAdmin({
      email: ' ADMIN@EXAMPLE.COM ',
      password: PASSWORD,
      findByEmail,
      create,
      hashPassword: (password) => bcrypt.hash(password, 10),
    });

    expect(findByEmail).toHaveBeenCalledWith(EMAIL);
    expect(user.email).toBe(EMAIL);
    expect(user.role).toBe('admin');
    expect(user.passwordHash).not.toBe(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, user.passwordHash)).toBe(true);
  });

  it('updates an existing user to admin', async () => {
    const existing = new User();
    existing.email = EMAIL;
    existing.passwordHash = 'old-hash';
    existing.role = 'user';
    const findByEmail = vi.fn<(email: string) => Promise<User | null>>().mockResolvedValue(existing);
    const create = vi.fn<(user: User) => Promise<User>>().mockImplementation(async (user) => persist(user));

    const user = await seedAdmin({
      email: EMAIL,
      password: PASSWORD,
      findByEmail,
      create,
      hashPassword: (password) => bcrypt.hash(password, 10),
    });

    expect(create).toHaveBeenCalledWith(existing);
    expect(user.role).toBe('admin');
    expect(user.passwordHash).not.toBe('old-hash');
  });

  it.each([
    ['email missing', undefined, PASSWORD],
    ['email blank', '   ', PASSWORD],
    ['password missing', EMAIL, undefined],
    ['password blank', EMAIL, ''],
  ])('fails clearly when %s', async (_label, email, password) => {
    const findByEmail = vi.fn<(email: string) => Promise<User | null>>();
    const create = vi.fn<(user: User) => Promise<User>>();

    await expect(seedAdmin({
      email,
      password,
      findByEmail,
      create,
      hashPassword: (value) => bcrypt.hash(value, 10),
    })).rejects.toThrow('ADMIN_EMAIL and ADMIN_PASSWORD are required to run pnpm seed:admin');

    expect(findByEmail).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
