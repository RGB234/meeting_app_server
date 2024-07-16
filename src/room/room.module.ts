import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room } from './room.entity';
import { User } from 'src/user/user.entity';
import { UserToRoom } from './userToRoom.entity';
import { Message } from 'src/chat/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, User, UserToRoom, Message])],
  providers: [RoomService],
  controllers: [RoomController],
})
export class RoomModule {}
