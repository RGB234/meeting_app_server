import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { Authentication } from 'src/authentication/authentication.entity';
import { UserToRoom } from 'src/room/userToRoom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Authentication, User, UserToRoom])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
