import { IsString, IsUUID } from 'class-validator';

export class DeleteAccountDto {
  @IsUUID()
  authenticationId: string;

  @IsString()
  password: string;
}
