import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt_access_token',
) {
  constructor(private readonly configService: ConfigService) {
    // Passport first verifies the JWT's signature and decodes the JSON.
    // It then invokes our validate() method passing the decoded JSON
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          console.log('Access token > ', request?.cookies?.access_token);
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
      // 콜백함수인 validate 함수의 첫번째 인자에 request 전달여부
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AccessTokenPayload) {
    console.log('???');
    // request 에 payload 저장.
    // attach it as a property on the Request object.
    req.user = payload;
    console.log('return val: ', {
      authId: payload.sub,
      authEmail: payload.email,
    });
    return { authId: payload.sub, authEmail: payload.email };
  }
}
