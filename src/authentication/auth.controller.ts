import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './dtos/create-account-dto';
import { DeleteAccountDto } from './dtos/delete-account-dto';
import { UpdateAccountDto } from './dtos/update-account-dto';
import { DeleteResult, UpdateResult } from 'typeorm';
import { Public } from './auth.decorator';
import { LoginDto } from './dtos/login-dto';
import { Response } from 'express';
import { JwtRefreshTokenGuard } from './jwt-refresh-token.guard';
import { JwtAccessTokenGuard } from './jwt-access-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokenSet = await this.authService.login(loginDto);

    // expressJs
    // Cookie 에 토큰들 저장
    // response.setHeader('Authorization', 'Bearer ' + Object.values(tokenSet));
    response.cookie('access_token', tokenSet.access_token, { httpOnly: true });
    response.cookie('refresh_token', tokenSet.refresh_token, {
      httpOnly: true,
    });

    return tokenSet;
  }

  // @UseGuards(JwtAccessTokenGuard) // default
  @UseGuards(JwtRefreshTokenGuard)
  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    await this.authService.logout(req.user.id);

    // Clear cookie (tokens)
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.send('Logout Success');
  }

  // refresh access token using a refresh token if that refresh token is valid.
  @Public() // Deactivate JwtAccessTokenGuard which is a Global Guard
  @UseGuards(JwtRefreshTokenGuard)
  @Post('refresh')
  async refreshAccessToken(@Req() req: any, @Res() res: Response) {
    // The 'user' field is added to the request while passing through JwtRefreshTokenGuard.
    const authId = req.user.sub;
    const tokenSet = await this.authService.refreshAccessToken(
      authId,
      req.cookies['refresh_token'],
    );

    res.cookie('access_token', tokenSet.accessToken, { httpOnly: true });

    return res.send('access token reissue completed');
  }

  // @UseInterceptors(ClassSerializerInterceptor)
  @Post('create')
  @UsePipes(
    new ValidationPipe({
      // transform: true,
      // If set 'whitelist' to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
      whitelist: true,
    }),
  )
  async postAccount(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<Authentication> {
    console.log(createAccountDto);
    return await this.authService.createAccount(createAccountDto);
  }

  @Patch('password')
  async updateAccount(
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req: any,
  ): Promise<UpdateResult> {
    return await this.authService.updateAccount(updateAccountDto);
  }

  @Delete('delete')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )
  async deleteAccount(
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<DeleteResult> {
    try {
      return await this.authService.deleteAccount(deleteAccountDto);
    } catch (err) {
      if (err instanceof BadRequestException) {
        console.log(err.message);
        throw err;
      } else {
        throw err;
      }
    }
  }
}
