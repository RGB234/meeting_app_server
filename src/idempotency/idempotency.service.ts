import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { RedisCacheService } from 'src/cache/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdempotencyService {
  constructor(private readonly cacheManager: RedisCacheService) {}

  // 최초 socket 연결시 실행
  // 1. generate a uuid as a key
  // 2. attach the key to the socket header (idempotency-key field)
  async issueIdempotencyKey(socket: Socket) {
    const idempotencyKey = uuidv4();

    // await this.cacheManager.set(
    //   idempotencyKey,
    //   socket.handshake.query.userId,
    //   // 3,
    // );

    // socket.handshake.headers 의 필드 중 하나에 idempotency Key 저장
    socket.handshake.headers['idempotent-key'] = idempotencyKey;
    return idempotencyKey;
  }

  async keyExists(key: string): Promise<boolean> {
    if ((await this.cacheManager.get(key)) === undefined) {
      return false;
    }
    return true;
  }

  async saveIdempotencyKey(key: string, socket: Socket) {
    if (await this.keyExists(key)) {
      return;
    }
    await this.cacheManager.set(key, socket.handshake.query.userId);
  }

  // Must be executed after completing a task that requires idempotency
  async deleteIdempotencyKey(key: string) {
    await this.cacheManager.del(key);
  }

  // check if a key is in the redis cache storage
  async validateWsIdempotencyKey(socket: Socket) {
    let idempotencyKey = socket.request.headers['idempotency-key'].at(0);

    if (!idempotencyKey) return false;

    // [Bearer, {UUIDv4}]
    idempotencyKey = idempotencyKey.split(' ').at(1);

    const value = await this.cacheManager.get(idempotencyKey);
    if (value)
      return false; // ttl 시간 내에 동일한 요청이 들어왔었음
    else return true;
  }
}
