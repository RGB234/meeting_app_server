import { ApiProperty, ApiSecurity } from '@nestjs/swagger';
import { IS_STRING, IsEmail, IsString, IsUUID } from 'class-validator';
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
}
