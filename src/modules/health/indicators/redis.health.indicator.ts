import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../../../redis/redis.service.js';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isOk = await this.redisService.ping();
      if (isOk) {
        return this.getStatus(key, true);
      }
      throw new Error('Redis ping did not return PONG');
    } catch {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false),
      );
    }
  }
}
