import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { PrimaryColumn } from 'typeorm';

export class CreateRoomDto {
  @PrimaryColumn()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  location: string;

  @IsOptional()
  @IsNumber()
  maxMaleCount?: number;

  @IsOptional()
  @IsNumber()
  maxFemaleCount?: number;

  @IsNumber()
  maleCount: number = 0;

  @IsNumber()
  femaleCount: number = 0;

  constructor() {
    if (this.maxMaleCount === undefined) {
      this.maxMaleCount = 4;
    }
    if (this.maxFemaleCount === undefined) {
      this.maxFemaleCount = 4;
    }
  }
}
