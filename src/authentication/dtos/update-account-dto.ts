import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateAccountDto } from './create-account-dto';

export class UpdateAccountDto extends IntersectionType(
  PartialType(CreateAccountDto),
) {
  @ApiProperty()
  @IsUUID()
  authId: string;

  @IsOptional()
  @ApiProperty()
  @IsString()
  refreshToken: string = null;
}
