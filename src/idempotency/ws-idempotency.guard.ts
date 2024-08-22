import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsIdempotencyGuard implements CanActivate {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient();
    const idempotencyKey = socket.handshake.headers['idempotency-key'];

    if (!idempotencyKey) {
      throw new WsException('Idempotency key is null or undefined');
    }

    return await this.idempotencyService.validateWsIdempotencyKey(socket);
  }
}
