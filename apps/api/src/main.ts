import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const defaultVersion = config.get<string>('API_VERSION', '1');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allowedOrigins = config
    .get<string>('FRONTEND_URL', 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
