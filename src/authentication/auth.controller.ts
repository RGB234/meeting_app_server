import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './create-account-dto';
import { DeleteAccountDto } from './delete-account-dto';
import { UpdateAccountDto } from './update-account-dto';
import { DeleteResult, UpdateResult } from 'typeorm';
import { signInDto } from './signIn-dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: signInDto) {
    return this.authService.signIn(signInDto);
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

  @UseGuards(AuthGuard)
  @Patch('password')
  async updateAccount(
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<UpdateResult> {
    return await this.authService.changePassword(updateAccountDto);
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
