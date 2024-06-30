import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateMessageDto {
  // By default, all of these fields are required.
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  writerId: number;

  @IsDate()
  createdAt: Date;

  @IsBoolean()
  deleted: boolean;

  @IsString()
  text: string;
}
