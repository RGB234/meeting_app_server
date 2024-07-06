import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Authentication } from './auth.entity';
import { CreateAccountDto } from './create-account-dto';
import { DeleteAccountDto } from './delete-account-dto';

@Controller('authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
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

  @Delete('delete')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
    }),
  )
  async DeleteAccountDto(
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<void> {
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
