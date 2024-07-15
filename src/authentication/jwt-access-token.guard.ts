import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './auth.decorator';

// @Injectable()
// export class JwtAccessTokenGuard extends AuthGuard('access_token') {}

// named stratagy
// jwt-access-token.strategy.ts
// export class JwtAccessTokenStrategy extends PassportStrategy(
//   Strategy,
//   'jwt_access_token',
// )
@Injectable()
export class JwtAccessTokenGuard extends AuthGuard('jwt_access_token') {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
    // get a Handler's Metadata. A value corresponding to IS_PUBLIC_KEY.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
