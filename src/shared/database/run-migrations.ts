import 'reflect-metadata';
import { dataSource } from './data-source.js';

async function runMigrations(): Promise<void> {
  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
    console.log('Migrations applied successfully');
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runMigrations().catch((error: unknown) => {
  console.error('Failed to apply migrations', error);
  process.exitCode = 1;
});
