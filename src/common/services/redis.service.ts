import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Scope,
} from '@nestjs/common';
import { Redis } from 'ioredis';


@Injectable({ scope: Scope.DEFAULT })
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private static client: Redis;

  onModuleInit() {
    this.getClient();
  }

  async onModuleDestroy() {
    if (RedisService.client) {
      await RedisService.client.quit();
    }
  }

  getClient(): Redis {
    if (!RedisService.client) {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = Number(process.env.REDIS_PORT) || 6379;
      const tls = process.env.REDIS_TLS === 'true' ? {} : undefined;

      RedisService.client = new Redis({
        host,
        port,
        tls,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      RedisService.client.on('error', (err) => {
        console.error('Redis connection error:', err);
      });

      RedisService.client.on('connect', () => {
        console.log('Connected to Redis');
      });
    }
    return RedisService.client;
  }

  async set(key: string, value: string, expiration?: number) {
    if (expiration) {
      await RedisService.client.set(key, value, 'EX', expiration);
    } else {
      await RedisService.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return RedisService.client.get(key);
  }

  async del(key: string) {
    await RedisService.client.del(key);
  }

  async keys(keyPattern: string): Promise<Array<string>> {
    return RedisService.client.keys(keyPattern);
  }

  async setEx(key: string, expireTime: number, data: any): Promise<void> {
    await RedisService.client.setex(key, expireTime, data);
  }
}