import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID } from 'class-validator';
import { CreateAccountDto } from './create-account-dto';

// export class UpdateAccountDto {
//   // PK
//   // @IsUUID()
//   // uid: UUID;

//   @ApiProperty()
//   @IsEmail()
//   // @IsString()
//   email: string;

//   @ApiProperty()
//   @IsString()
//   password: string;
// }

export class UpdateAccountDto extends IntersectionType(
  PartialType(CreateAccountDto),
) {
  @ApiProperty()
  @IsUUID()
  id: string;
}
