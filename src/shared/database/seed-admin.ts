import 'reflect-metadata';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { create, findByEmail } from '../../features/users/repositories/users.repository.js';
import { SALT_ROUNDS, seedAdmin } from './seed-admin.logic.js';
import { dataSource } from './data-source.js';

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    const user = await seedAdmin({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      findByEmail,
      create,
      hashPassword: (password) => bcrypt.hash(password, SALT_ROUNDS),
    });
    console.log(`Admin user ready for ${user.email}`);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error: unknown) => {
  console.error('Failed to seed admin', error);
  process.exitCode = 1;
});
