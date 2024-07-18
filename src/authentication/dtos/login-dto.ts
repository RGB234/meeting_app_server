import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { CreateAccountDto } from './create-account-dto';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}
