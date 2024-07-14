import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt_refresh_token',
) {
  constructor(
    private readonly configSerivce: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          console.log('Refresh token > ', request?.cookies?.refresh_token);
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configSerivce.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    const refreshToken = req?.cookies?.refresh_token;
    const isValid = await this.authService.validateRefreshToken(
      payload.sub,
      refreshToken,
    );
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');
    // request 에 payload 저장
    req.user = payload;
    return payload;
  }
}
