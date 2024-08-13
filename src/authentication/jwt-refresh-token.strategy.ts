import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  JwtStrategy,
  'jwt_refresh_token',
) {
  constructor(
    private readonly configSerivce: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          const refreshToken = request?.cookies?.refresh_token;
          if (!refreshToken)
            throw new UnauthorizedException('REFRESH TOKEN is undefined');
          // console.log('Refresh token > ', refreshToken);
          return refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configSerivce.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    // payload : decodeded JwtToken (e.g. refreshToken)

    // const refreshToken = req?.cookies?.refresh_token;
    // const isValid = await this.authService.validateRefreshToken(
    //   req?.body?.authId,
    //   refreshToken,
    // );

    const authId = req.body.authId;

    const isValid = authId ? authId === payload.sub : false;
    if (!isValid)
      throw new UnauthorizedException(
        'auth Id is null or undefined. JwtRefreshTokenStrategy validation fail',
      );
    // request 에 리턴값 저장 : 코드를 작성하지 않아도 자동으로 PassportStrategy 가 수행하는 동작임
    // req.user = payload;
    return payload;
  }
}
