import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './room.entity';
import { User } from 'src/user/user.entity';
import { UserToRoom } from './userToRoom.entity';
import { Message } from 'src/chat/message.entity';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/authentication/auth.service';
import { Authentication } from 'src/authentication/auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, User, UserToRoom, Message, Authentication]),
  ],
  providers: [RoomService, UserService, AuthService],
  controllers: [RoomController],
  exports: [RoomModule],
})
export class RoomModule {}
