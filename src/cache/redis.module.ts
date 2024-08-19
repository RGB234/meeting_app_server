import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis.service';
@Module({
  imports: [],
  // imports: [cacheModule],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
  controllers: [],
})
export class RedisCacheModule {}
