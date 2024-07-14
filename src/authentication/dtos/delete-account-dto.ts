import { IsString, IsUUID } from 'class-validator';

export class DeleteAccountDto {
  @IsUUID()
  authId: string;

  @IsString()
  password: string;
}
