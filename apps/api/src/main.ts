import './prisma/prisma-engine.guard';

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express, NextFunction, Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const trustProxyRaw = config.get<string>('TRUST_PROXY');
  if (trustProxyRaw && trustProxyRaw.trim().length > 0) {
    const normalized = trustProxyRaw.trim().toLowerCase();
    const truthy = ['true', '1', 'yes', 'y', 'on'];
    const falsy = ['false', '0', 'no', 'n', 'off'];

    const expressApp = app.getHttpAdapter().getInstance() as Express;

    if (truthy.includes(normalized)) {
      expressApp.set('trust proxy', 1);
    } else if (!falsy.includes(normalized)) {
      const parsed = Number(normalized);
      if (Number.isFinite(parsed) && parsed >= 0) {
        expressApp.set('trust proxy', parsed);
      }
    }
  }

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

  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const swaggerDefault = nodeEnv === 'production' ? 'false' : 'true';
  const swaggerEnabled =
    config.get<string>('SWAGGER_ENABLED', swaggerDefault).toLowerCase() !==
    'false';

  const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs');
  const swaggerRoutePrefix = `/${apiPrefix}/${swaggerPath}`;

  const helmetWithCsp = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  });

  const helmetWithoutCsp = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl ?? req.url;
    if (swaggerEnabled && url.startsWith(swaggerRoutePrefix)) {
      return helmetWithoutCsp(req, res, next);
    }
    return helmetWithCsp(req, res, next);
  });

  if (swaggerEnabled) {
    const brandName = config.get<string>('BRAND_NAME', 'TutorStartup');
    const swaggerConfig = new DocumentBuilder()
      .setTitle(`${brandName} API`)
      .setDescription(`API documentation for ${brandName}`)
      .setVersion(String(defaultVersion))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup(swaggerPath, app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: `${swaggerPath}-json`,
    });
  }

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
