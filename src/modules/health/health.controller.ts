import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator.js';
import { PrismaHealthIndicator } from './indicators/prisma.health.indicator.js';
import { RedisHealthIndicator } from './indicators/redis.health.indicator.js';

type BuildInfo = {
  version: string;
  nestVersion: string;
  gitCommit: string;
};

function getBuildInfo(): BuildInfo {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
    ) as {
      version?: string;
      dependencies?: Record<string, string>;
    };
    let gitCommit = 'unknown';
    try {
      gitCommit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
        encoding: 'utf8',
      }).trim();
    } catch {
      // Git metadata is optional in production images.
    }
    return {
      version: packageJson.version ?? 'unknown',
      nestVersion: packageJson.dependencies?.['@nestjs/core'] ?? 'unknown',
      gitCommit,
    };
  } catch {
    return { version: 'unknown', nestVersion: 'unknown', gitCommit: 'unknown' };
  }
}

function getSystemInfo() {
  const memory = process.memoryUsage();
  const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;
  const build = getBuildInfo();
  return {
    uptimeSec: process.uptime(),
    memoryMB: {
      heapUsed: toMb(memory.heapUsed),
      heapTotal: toMb(memory.heapTotal),
      rss: toMb(memory.rss),
    },
    nodeVersion: process.version,
    nestVersion: build.nestVersion,
    appVersion: build.version,
    gitCommit: build.gitCommit,
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    const result = await this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      () => this.redisIndicator.isHealthy('redis'),
    ]);
    const system = getSystemInfo();
    return {
      ...result,
      info: { ...result.info, system },
      details: { ...result.details, system },
    };
  }
}
