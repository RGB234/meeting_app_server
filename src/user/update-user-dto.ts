import { UUID } from 'crypto';
import { CreateUserDto } from './create-user-dto';
import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';

// ref. https://docs.nestjs.com/openapi/mapped-types

// authenticationId is Required, the others are optional
export class UpdateUserDto extends IntersectionType(
  PartialType(OmitType(CreateUserDto, ['authId'] as const)),
  PickType(CreateUserDto, ['authId'] as const),
) {}
