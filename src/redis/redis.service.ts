import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = parseInt(
      this.configService.get<string>('REDIS_PORT') || '6379',
      10,
    );

    try {
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
      } else {
        this.client = new Redis({
          host,
          port,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
      }

      this.client.on('error', (err: Error) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.logger.log(
        `Redis client configured for ${redisUrl ? redisUrl : `${host}:${port}`}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to initialize Redis client: ${message}`);
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}
