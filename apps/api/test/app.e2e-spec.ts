import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  RequestMethod,
  VersioningType,
} from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ConfigService } from '@nestjs/config';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const config = app.get(ConfigService);
    const apiPrefix = config.get<string>('API_PREFIX', 'api');
    app.setGlobalPrefix(apiPrefix, {
      exclude: [
        { path: 'health/live', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: config.get<string>('API_VERSION', '1'),
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health/live (GET)', async () => {
    const response: Response = await request(app.getHttpServer()).get(
      '/health/live',
    );

    expect(response.status).toBe(200);
    const body = JSON.parse(response.text) as { status: string };
    expect(body.status).toBe('ok');
  });
});
