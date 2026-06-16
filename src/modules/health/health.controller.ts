import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
} from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { MongoHealthIndicator } from './indicators/mongo.health-indicator';
import { RedisHealthIndicator } from './indicators/redis.health-indicator';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongo: MongoHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get('health')
  getHealth(): HealthCheckResult {
    return {
      status: 'ok',
      info: {},
      error: {},
      details: {},
    };
  }

  @Get('readiness')
  @HealthCheck()
  async getReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.mongo.isHealthy('mongo'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}