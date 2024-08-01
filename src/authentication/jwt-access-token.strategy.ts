import { Injectable, UnauthorizedException } from '@nestjs/common';
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
          const accessToken = request?.cookies?.access_token;
          if (!accessToken)
            throw new UnauthorizedException('ACCESS TOKEN is undefined');
          // console.log('Access token > ', accessToken);
          // console.log(configService.get<string>('JWT_ACCESS_SECRET'));
          return accessToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
      // 콜백함수인 validate 함수의 첫번째 인자에 request 전달여부
      passReqToCallback: true,
    });
  }

  // The validate method of your JwtStrategy will only be called when the token has been verified in terms of the encryption
  // (corrrect key was used to sign it, in your case secretKey) and it is not expired.
  validate(req: Request, payload: AccessTokenPayload) {
    // Passport will build a user object based on the return value of our validate() method,
    // and attach it as a property on the Request object.

    // Make sure to match the request.body.id with the authentication ID in the payload (sub)
    // req.body.authId is not null When the request goes through AuthService.
    if (req.body?.authId && payload.sub != req.body.authId) {
      console.log('authId does not match access token payload');
      throw new UnauthorizedException('ACCESS DENIDED');
    }
    // req.user = payload;
    // return { sub: payload.sub, authEmail: payload.email };
    return payload;
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
