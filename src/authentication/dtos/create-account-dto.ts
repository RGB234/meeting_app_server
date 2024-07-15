import { ApiProperty, ApiSecurity } from '@nestjs/swagger';
import { IS_STRING, IsDate, IsEmail, IsString, IsUUID } from 'class-validator';
import { Timestamp } from 'typeorm';
// import { UUID } from 'crypto';

export class CreateAccountDto {
  // PK
  // @IsUUID()
  // uid: UUID;

  @ApiProperty()
  @IsEmail()
  // @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  refreshToken: string = null;
}
