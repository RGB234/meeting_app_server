import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
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
  maxMaleCount: number;

  @IsNumber()
  maxFemaleCount: number;
}
