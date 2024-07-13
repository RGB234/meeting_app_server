import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access_token',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          console.log(request?.cookies);
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    // Passport will build a `user` object based on the return value of our `validate()` method,
    // and attach it as a property on the `Request` object.

    // auth.service.ts
    //     const payload = { sub: auth.id, authEmail: auth.email };
    // return { authId: payload.sub, authEmail: payload.authEmail };
    return payload;
  }
}
