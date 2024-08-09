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
  // AuthGuard's strategy is JwtAccessTokenStrategy that named 'jwt_access_token'
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log('1수');

    const requesType = context.getType();

    if (requesType == 'http') {
      console.log('2수');
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [
          // https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata
          // get a Handler's Metadata.
          context.getHandler(),
          context.getClass(),
        ],
      );
      if (isPublic) {
        return true;
      }
    }
    console.log('3수');
    return super.canActivate(context);
  }
}
