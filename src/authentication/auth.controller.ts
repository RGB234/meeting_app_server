import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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

  // @UseGuards(AuthGuard)
  // @UseGuards(JwtAuthGuard)
  @Patch('password')
  async updateAccount(
    @Body() updateAccountDto: UpdateAccountDto,
    @Request() req,
  ): Promise<UpdateResult> {
    console.log(req.user);
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
