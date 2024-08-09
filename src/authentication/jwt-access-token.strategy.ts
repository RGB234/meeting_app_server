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

  // The validate method of a JwtStrategy will only be called when the correct secretKey is used to encrypt a token
  // and JWT is not expired.
  async validate(req: Request | Socket, payload: AccessTokenPayload) {
    console.log('4수');
    // Passport will build a user object  based on the return value of our validate() method,
    // and attach it as a property on the Request object. (i.e. request.user)

    // Check whether the authId in the payload matches the authId of the sender of the request.
    if ((req as Request).body) {
      console.log('5수');
      // req.body.authId is not null After the request goes through AuthService.
      if (
        (req as Request).body.authId &&
        payload.sub != (req as Request).body.authId
      ) {
        console.log('authId does not match access token payload');
        throw new UnauthorizedException('ACCESS DENIED');
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
