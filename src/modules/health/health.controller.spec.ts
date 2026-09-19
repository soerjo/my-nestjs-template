import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller.js';
import { HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health.indicator.js';
import { RedisHealthIndicator } from './indicators/redis.health.indicator.js';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthCheckService = {
    check: jest
      .fn()
      .mockImplementation(async (indicators: Array<() => Promise<unknown>>) => {
        const results = await Promise.all(indicators.map((fn) => fn()));
        const info = Object.assign({}, ...results);
        return { status: 'ok', info, error: {}, details: info };
      }),
  };

  const mockPrismaIndicator = {
    isHealthy: jest.fn().mockResolvedValue({
      database: { status: 'up', latencyMs: 5 },
    }),
  };

  const mockRedisIndicator = {
    isHealthy: jest.fn().mockResolvedValue({
      redis: { status: 'up', latencyMs: 1 },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaIndicator },
        { provide: RedisHealthIndicator, useValue: mockRedisIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns enriched monitoring metrics', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    const info = result.info as unknown as {
      database: { latencyMs: number };
      redis: { latencyMs: number };
      system: {
        uptimeSec: number;
        memoryMB: { heapUsed: number; heapTotal: number; rss: number };
        nodeVersion: string;
      };
    };
    expect(info.database.latencyMs).toEqual(expect.any(Number));
    expect(info.redis.latencyMs).toEqual(expect.any(Number));
    expect(info.system.uptimeSec).toBeGreaterThan(0);
    expect(info.system.memoryMB).toEqual({
      heapUsed: expect.any(Number),
      heapTotal: expect.any(Number),
      rss: expect.any(Number),
    });
    expect(info.system.nodeVersion).toEqual(process.version);
  });
});
