import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Authentication } from './auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Authentication]),
    JwtModule.register({
      // registering the JwtModule as global to make things easier for us.
      // This means that we don't need to import the JwtModule anywhere else in our application.
      global: true,
      secret: process.env.JWT_CONSTANTS,
      signOptions: {
        expiresIn: '600s', // token expiration time
      },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // register the AuthGuard as a global guard
    // using the following construction in any module
    {
      provide: APP_GUARD,
      // ./auth.guard';
      // useClass: AuthGuard,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
