import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { HealthService } from './health.service';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  async ready() {
    const result = await this.healthService.readiness();
    if (result.status === 'ok') {
      return result;
    }

    throw new ServiceUnavailableException(result);
  }
}
