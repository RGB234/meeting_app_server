import {
  IntersectionType,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { CreateRoomDto } from './create-room-dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateRoomDto extends IntersectionType(
  // optional
  PartialType(
    OmitType(CreateRoomDto, ['id', 'maxFemaleCount', 'maxMaleCount'] as const),
  ),
  // assential
  PickType(CreateRoomDto, ['id'] as const),
) {
  // Unlike CreateDto, there is no default value.
  @IsOptional()
  @IsNumber()
  maxFemaleCount?: number;

  // Unlike CreateDto, there is no default value.
  @IsOptional()
  @IsNumber()
  maxMaleCoint?: number;
}
