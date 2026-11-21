import { User } from '../../features/users/entities/user.entity.js';

export const SALT_ROUNDS = 10;

export interface SeedAdminDeps {
  email?: string | undefined;
  password?: string | undefined;
  findByEmail: (email: string) => Promise<User | null>;
  create: (user: User) => Promise<User>;
  hashPassword: (password: string) => Promise<string>;
}

export async function seedAdmin(deps: SeedAdminDeps): Promise<User> {
  const email = deps.email?.trim().toLowerCase();
  const password = deps.password;

  if (email === undefined || email === '' || password === undefined || password === '') {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required to run pnpm seed:admin');
  }

  const existing = await deps.findByEmail(email);
  const admin = existing ?? new User();
  admin.email = email;
  admin.passwordHash = await deps.hashPassword(password);
  admin.role = 'admin';

  return deps.create(admin);
}
