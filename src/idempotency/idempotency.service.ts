import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { RedisCacheService } from 'src/cache/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdempotencyService {
  constructor(private readonly cacheManager: RedisCacheService) {}

  issueIdempotencyKey() {
    const idempotencyKey = uuidv4();
    return idempotencyKey;
  }

  // validation
  async validateWsIdempotencyKey(socket: Socket) {
    const idempotencyKey = socket.request.headers['idempotency-key'];
  }
}
