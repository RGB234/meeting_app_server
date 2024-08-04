import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Area } from './room.entity';
import { IntersectionType, PickType } from '@nestjs/swagger';
import { CreateRoomDto } from './create-room-dto';
import { PartialGraphHost } from '@nestjs/core';

export class MatchCriteriaDto extends PickType(CreateRoomDto, [
  'location',
  // 'maxFemaleCount',
  // 'maxMaleCount',
] as const) {
  // Unlike CreateDto, there is no default value.
  @IsNumber()
  @IsOptional()
  maxMaleCount?: number;
  // Unlike CreateDto, there is no default value.
  @IsNumber()
  @IsOptional()
  maxFemaleCount?: number;
}
