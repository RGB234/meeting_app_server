import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateRoomDto {
  // PK
  // @IsNotEmpty()
  // @IsNumber()
  // id: number;

  // @IsNumber()
  // managerId: number;

  // @IsDate()
  // createdAt: Date;

  // @IsString()
  // title: String;

  @IsNumber()
  maxMaleCount: number;

  @IsNumber()
  maxFemaleCount: number;
}
