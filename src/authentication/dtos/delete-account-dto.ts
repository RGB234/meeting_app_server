import { IntersectionType, PickType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { CreateAccountDto } from './create-account-dto';

// export class DeleteAccountDto {
//   @IsUUID()
//   id: string;

//   @IsString()
//   password: string;
// }
export class DeleteAccountDto extends IntersectionType(
  PickType(CreateAccountDto, ['password'] as const),
) {
  @IsUUID()
  authId: string;
}
