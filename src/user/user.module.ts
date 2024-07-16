import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { Authentication } from 'src/authentication/auth.entity';
import { UserToRoom } from 'src/room/userToRoom.entity';
import { AuthService } from 'src/authentication/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Authentication, UserToRoom])],
  providers: [UserService, AuthService],
  controllers: [UserController],
})
export class UserModule {}
