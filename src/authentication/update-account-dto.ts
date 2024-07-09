import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UpdateAccountDto {
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
