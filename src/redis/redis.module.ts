// // src/redis/redis.module.ts
// import { Global, Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { RedisService } from './redis.service';
// import { Redis } from 'ioredis';  // ← named import, not default

// export const REDIS_CLIENT = 'REDIS_CLIENT';

// @Global()
// @Module({
//   imports: [ConfigModule],
//   providers: [
//     {
//       provide: REDIS_CLIENT,
//       useFactory: (configService: ConfigService) => {
//         const client = new Redis({
//           host: configService.get<string>('redis.host'),
//           port: configService.get<number>('redis.port'),
//           password: configService.get<string>('redis.password') || undefined,
//           retryStrategy: (times) => Math.min(times * 50, 2000),
//         });

//         client.on('error', (err) => console.error('❌ Redis Error:', err));
//         client.on('connect', () => console.log('✅ Redis connected'));

//         return client;  // ← no await/connect() — ioredis auto-connects
//       },
//       inject: [ConfigService],
//     },
//     RedisService,
//   ],
//   exports: [REDIS_CLIENT, RedisService],
// })
// export class RedisModule {}
// src/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}