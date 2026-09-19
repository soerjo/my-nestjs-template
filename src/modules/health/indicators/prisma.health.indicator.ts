import { performance } from 'node:perf_hooks';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startedAt = performance.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
      return this.getStatus(key, true, { latencyMs });
    } catch {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
        }),
      );
    }
  }
}
