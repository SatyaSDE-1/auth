// // src/redis/redis.service.ts
// import { Inject, Injectable, Logger } from '@nestjs/common';
// import { Redis } from 'ioredis';  // ← named import, not default
// import { REDIS_CLIENT } from './redis.module';

// @Injectable()
// export class RedisService {
//   private readonly logger = new Logger(RedisService.name);

//   constructor(
//     @Inject(REDIS_CLIENT) private readonly redis: Redis,
//   ) {}

//   async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
//     if (ttlSeconds) {
//       await this.redis.setex(key, ttlSeconds, value);
//     } else {
//       await this.redis.set(key, value);
//     }
//   }

//   async get(key: string): Promise<string | null> {
//     return this.redis.get(key);
//   }

//   async del(key: string): Promise<void> {
//     await this.redis.del(key);
//   }

//   async delByPattern(pattern: string): Promise<void> {
//     const keys = await this.redis.keys(pattern);
//     if (keys.length > 0) {
//       await this.redis.del(...keys);
//     }
//   }

//   async exists(key: string): Promise<boolean> {
//     const result = await this.redis.exists(key);
//     return result === 1;
//   }

//   async ttl(key: string): Promise<number> {
//     return this.redis.ttl(key);
//   }

//   async storeRefreshToken(userId: string, tokenId: string, ttl: number): Promise<void> {
//     await this.set(this.getRefreshTokenKey(userId, tokenId), '1', ttl);
//   }

//   async isRefreshTokenValid(userId: string, tokenId: string): Promise<boolean> {
//     return this.exists(this.getRefreshTokenKey(userId, tokenId));
//   }

//   async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
//     await this.del(this.getRefreshTokenKey(userId, tokenId));
//   }

//   async revokeAllRefreshTokens(userId: string): Promise<void> {
//     await this.delByPattern(`refresh_token:${userId}:*`);
//   }

//   async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
//     await this.set(this.getBlacklistKey(jti), '1', ttlSeconds);
//   }

//   async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
//     return this.exists(this.getBlacklistKey(jti));
//   }

//   private getRefreshTokenKey(userId: string, tokenId: string): string {
//     return `refresh_token:${userId}:${tokenId}`;
//   }

//   private getBlacklistKey(jti: string): string {
//     return `blacklist:${jti}`;
//   }
// }


// src/redis/redis.service.ts
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password') || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('connect', () => this.logger.log('✅ Redis connected'));
    this.client.on('error', (err) => this.logger.error('❌ Redis error', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async storeRefreshToken(userId: string, tokenId: string, ttl: number): Promise<void> {
    await this.set(this.getRefreshTokenKey(userId, tokenId), '1', ttl);
  }

  async isRefreshTokenValid(userId: string, tokenId: string): Promise<boolean> {
    return this.exists(this.getRefreshTokenKey(userId, tokenId));
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.del(this.getRefreshTokenKey(userId, tokenId));
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.delByPattern(`refresh_token:${userId}:*`);
  }

  async blacklistAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.set(this.getBlacklistKey(jti), '1', ttlSeconds);
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    return this.exists(this.getBlacklistKey(jti));
  }

  private getRefreshTokenKey(userId: string, tokenId: string): string {
    return `refresh_token:${userId}:${tokenId}`;
  }

  private getBlacklistKey(jti: string): string {
    return `blacklist:${jti}`;
  }
}