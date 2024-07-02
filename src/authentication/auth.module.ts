import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Authentication } from './authentication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Authentication])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
