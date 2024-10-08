import { Module } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { RedisCacheModule } from 'src/cache/redis.module';

@Module({
  imports: [RedisCacheModule],
  providers: [IdempotencyService],
  exports: [IdempotencyService],
  controllers: [],
})
export class IdempotencyModule {}
