import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrapWorker() {
  // Ensure consumers can distinguish worker vs API process.
  process.env.PROCESS_ROLE = process.env.PROCESS_ROLE ?? 'worker';

  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  logger.log('Worker started', 'Bootstrap');
}

void bootstrapWorker();
