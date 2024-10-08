import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.contorller';
import { Room } from 'src/room/room.entity';
import { User } from 'src/user/user.entity';
import { Authentication } from 'src/authentication/auth.entity';
import { UserToRoom } from 'src/room/userToRoom.entity';
import { ChatGateway } from './chat.gateway';
import { RoomService } from 'src/room/room.service';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/authentication/auth.service';
import { JwtAccessTokenStrategy } from 'src/authentication/jwt-access-token.strategy';
import { IdempotencyService } from 'src/idempotency/idempotency.service';
import { RedisCacheModule } from 'src/cache/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Room, User, Authentication, UserToRoom]),
    RedisCacheModule,
  ],
  //   If you want to use the repository outside of the module
  //   which imports TypeOrmModule.forFeature,
  //   you'll need to re-export the providers generated by it.
  //   You can do this by exporting the whole module, like this:
  // exports: [TypeOrmModule],
  providers: [
    ChatService,
    ChatGateway,
    RoomService,
    UserService,
    AuthService,
    JwtAccessTokenStrategy,
    IdempotencyService,
  ],
  // controllers: [ChatController],
})
export class ChatModule {}
