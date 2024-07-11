import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_CONSTANTS,
    });
  }

  async validate(payload: any) {
    // Passport will build a `user` object based on the return value of our `validate()` method,
    // and attach it as a property on the `Request` object.

    // auth.service.ts
    //     const payload = { sub: auth.id, authEmail: auth.email };
    return { authId: payload.sub, authEmail: payload.authEmail };
  }
}
