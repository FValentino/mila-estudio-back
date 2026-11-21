import 'reflect-metadata';
import { app } from './app.js';
import { env } from './shared/config/env.js';
import { dataSource } from './shared/database/data-source.js';

async function start(): Promise<void> {
  await dataSource.initialize();
  app.listen(env.PORT, () => {
    console.log(`Mila Estudio API listening on port ${env.PORT}`);
  });
}

start().catch((error: unknown) => {
  console.error('Failed to start the Mila Estudio API', error);
  process.exitCode = 1;
});
