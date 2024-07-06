import { IsDate, IsNumber, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserDto {
  @IsUUID()
  authenticationId: UUID;

  @IsString()
  nickname: string;

  @IsString()
  name: string;

  @IsNumber()
  gender: number;

  @IsString()
  birthday: string;

  @IsString()
  affiliation: string;

  @IsString()
  account: string;

  @IsString()
  phoneNum: string;

  @IsString()
  photoURL: string;
}
