import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis.service';

@Module({
  imports: [],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
  controllers: [],
})
export class RedisCacheModule {}
