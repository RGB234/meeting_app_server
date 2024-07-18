import { ApiProperty, ApiSecurity } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateAccountDto {
  // PK
  // @IsUUID()
  // uid: UUID;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  // @ApiProperty()
  // @IsString()
  // refreshToken: string = null;
}
