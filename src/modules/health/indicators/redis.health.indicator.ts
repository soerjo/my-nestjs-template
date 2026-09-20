import { performance } from 'node:perf_hooks';
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
    const startedAt = performance.now();
    try {
      const isOk = await this.redisService.ping();
      const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
      if (isOk) {
        return this.getStatus(key, true, { latencyMs });
      }
      throw new Error('Redis ping did not return PONG');
    } catch {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
        }),
      );
    }
  }
}
