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
      .mockImplementation((indicators: Array<() => Promise<unknown>>) => {
        return Promise.all(indicators.map((fn) => fn())).then(() => ({
          status: 'ok',
          info: { database: { status: 'up' }, redis: { status: 'up' } },
          error: {},
          details: { database: { status: 'up' }, redis: { status: 'up' } },
        }));
      }),
  };

  const mockPrismaIndicator = {
    isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
  };

  const mockRedisIndicator = {
    isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
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

  it('should execute health check', async () => {
    const result = await controller.check();
    expect(result).toHaveProperty('status', 'ok');
    expect(mockHealthCheckService.check).toHaveBeenCalled();
  });
});
