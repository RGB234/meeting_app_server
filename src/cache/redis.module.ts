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
            // ElastiCache 는 동일한 서브넷에 속하는 EC2 인스턴스를 통해서 접속가능
            // 직접적으로 접근은 원칙상 안되지만 NAT 를 써서 가능은 한 듯 하다.

            // https://docs.aws.amazon.com/ko_kr/AmazonElastiCache/latest/mem-ug/accessing-elasticache.html
            // 외부에서 ElastiCache 리소스에 엑세스 부분

            // host: configService.get<string>('REDIS_HOST'),
            // 일단 개발 과정에서는 로컬로 사용
            // wsl, sudo service redis-server start
            host: 'localhost',
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
