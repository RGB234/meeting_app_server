import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Authentication } from './auth.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessTokenStrategy } from './jwt-access-token.strategy';
import { APP_GUARD } from '@nestjs/core';
import { JwtAccessTokenGuard } from './jwt-access-token.guard';
import { JwtRefreshTokenStrategy } from './jwt-refresh-token.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Authentication, User]),
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     secret: configService.get<string>('JWT_ACCESS_SECRET'),
    //     signOptions: {
    //       expiresIn: configService.get<string>('JWT_ACCESS_EXP'),
    //     },
    //   }),
    // }),
    // JwtModule.register({
    //   // registering the JwtModule as global to make things easier for us.
    //   // This means that we don't need to import the JwtModule anywhere else in our application.
    //   global: true,
    //   // secret: process.env.JWT_ACCESS_SECRET,
    //   // signOptions: {
    //   //   expiresIn: process.env.JWT_ACCESS_EXP, // token expiration time
    //   // },
    // }),
  ],
  providers: [
    AuthService,
    JwtAccessTokenStrategy,
    JwtRefreshTokenStrategy,
    // JwtRefreshTokenGuard,
    // JwtAccessTokenGuard,
    UserService,

    // register the Guard as a global guard
    // using the following construction in any module
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAccessTokenGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtRefreshTokenGuard,
    // },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
