import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Area } from './room.entity';

export class CreateRoomDto {
  // PK
  // @IsUUID()
  // id: number;

  // @IsNumber()
  // managerId: number;

  // @IsDate()
  // createdAt: Date;

  // @IsString()
  // title: String;

  @IsNotEmpty()
  location: Area;

  @IsNumber()
  maxMaleCount: number = 4;

  @IsNumber()
  maxFemaleCount: number = 4;
}

export class MatchCriteriaDto {
  @IsNotEmpty()
  location: Area;

  @IsNumber()
  @IsOptional()
  maxMaleCount?: number;

  @IsNumber()
  @IsOptional()
  maxFemaleCount?: number;
}
