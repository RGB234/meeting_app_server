import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserDto {
  // ref. https://github.com/nestjs/swagger/issues/1043
  // If you import the PartialType from the @nestjs/swagger package,
  // you should either annotate all DTO properties with the @ApiProperty() decorator OR
  // enable the @nestjs/swagger CLI Plugin. Otherwise (in case you don't want to use Swagger),
  // you should use PartialType from the @nestjs/mapped-types package instead
  @ApiProperty()
  @IsUUID()
  authenticationId: UUID;

  @ApiProperty()
  @IsString()
  nickname: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  gender: number;

  @ApiProperty()
  @IsString()
  birthday: string;

  @ApiProperty()
  @IsString()
  affiliation: string;

  @ApiProperty()
  @IsString()
  account: string;

  @ApiProperty()
  @IsString()
  phoneNum: string;

  @ApiProperty()
  @IsString()
  photoURL: string;
}
