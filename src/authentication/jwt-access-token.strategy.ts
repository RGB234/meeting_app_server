import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(
  JwtStrategy,
  'jwt_access_token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    // Passport first verifies the JWT's signature and decodes the JSON.
    // It then invokes our validate() method passing the decoded JSON
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request | Socket) => {
          if ((request as Socket).handshake) {
            return (request as Socket).handshake.auth?.access_token;
          }
          if ((request as Request).cookies) {
            return (request as Request).cookies.access_token;
          }
          throw new UnauthorizedException('ACCESS TOKEN is undefined');
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
      // 콜백함수인 validate 함수의 첫번째 인자에 request 전달여부
      passReqToCallback: true,
    });
  }

  // If a user is found and the credentials are valid, the user is returned so Passport can complete its tasks
  // (e.g., creating the user property on the Request object), and the request handling pipeline can continue.
  // If it's not found, we throw an exception and let our exceptions layer handle it.

  // The validate method of a JwtStrategy will only be called when the correct secretKey is used to encrypt a token
  // and JWT is not expired.
  async validate(req: Request | Socket, payload: AccessTokenPayload) {
    console.log('4수');

    // Check whether the authId in the payload matches the authId of the sender of the request.
    if ((req as Request).body) {
      console.log('5수');
      const authId = (req as Request).body.authId;
      if (!authId || payload.sub !== authId) {
        throw new UnauthorizedException(
          authId ? 'ACCESS DENIED' : 'authId is null or undefined',
        );
      }

      // req.user = payload;
      // return { sub: payload.sub, authEmail: payload.email };
      return payload;
    } else if ((req as Socket).handshake) {
      console.log('6수');
      if ((req as Socket).handshake.query?.userId) {
        console.log('7수');
        const userId = Number((req as Socket).handshake.query.userId);
        const auth = await this.userService.getAuthByUserId(userId);
        if (auth != null && auth.id == payload.sub) {
          console.log('8수');
          return payload;
        }
      } else {
        throw new UnauthorizedException(
          'userId was not passed (undefined or null)',
        );
      }
    }
    throw new UnauthorizedException('ACCESS DENIED');
  }

  // handleRequest(err, user, info) {
  //   // You can throw an exception based on either "info" or "err" arguments
  //   if (err || !user) {
  //     console.log(info);
  //     throw (
  //       err || new UnauthorizedException('request.user is undefined or null')
  //     );
  //   }
  //   return user;
  // }
}
