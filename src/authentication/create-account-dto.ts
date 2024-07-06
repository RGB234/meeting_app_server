import { IS_STRING, IsEmail, IsString, IsUUID } from 'class-validator';
// import { UUID } from 'crypto';

export class CreateAccountDto {
  // PK
  // @IsUUID()
  // uid: UUID;

  @IsEmail()
  // @IsString()
  email: string;

  @IsString()
  password: string;
}
