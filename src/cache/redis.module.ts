import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

// Note: cache-manager-redis-store is been discontinued to allow for the package we just installed.
// This package we installed (cache-manager-redis-yet) is been tracked directly by the Nestjs team.
// import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     store: await redisStore({
    //       socket: {
    //         host: configService.get<string>('REDIS_HOST'),
    //         port: configService.get<number>('REDIS_PORT'),
    //       },
    //       url: configService.get<string>('REDIS_ENDPOINT'),
    //       // ms
    //       ttl: 3 * 1000,
    //     }),
    //   }),
    //   inject: [ConfigService],
    // }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
          ttl: 3 * 1000,
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
  controllers: [],
})
export class RedisCacheModule {}
