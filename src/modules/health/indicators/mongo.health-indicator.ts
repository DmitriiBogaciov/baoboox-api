import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const isHealthy = this.connection.readyState === 1;

    if (!isHealthy) {
      return indicator.down({
        readyState: this.connection.readyState,
      });
    }

    return indicator.up({
      readyState: this.connection.readyState,
    });
  }
}