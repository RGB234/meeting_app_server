import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoomDto {
  // PK
  // @IsNotEmpty()
  // @IsNumber()
  // id: number;

  @IsNumber()
  managerID: number;

  @IsDate()
  createdAt: Date;

  @IsString()
  title: String;

  @IsNumber()
  maxMaleCount: number;

  @IsNumber()
  maxFemaleCount: number;
}
