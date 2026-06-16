import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MongoHealthIndicator } from './indicators/mongo.health-indicator';
import { RedisHealthIndicator } from './indicators/redis.health-indicator';
import { HealthResolver } from './health/health.resolver';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthResolver, MongoHealthIndicator, RedisHealthIndicator]
})
export class HealthModule {}
