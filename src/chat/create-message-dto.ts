import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { UUID } from 'crypto';

export class CreateMessageDto {
  // By default, all of these fields are required.

  // PK
  // @IsNotEmpty()
  // @IsNumber()
  // id: number;

  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsNumber()
  writerId: UUID;

  @IsDate()
  createdAt: Date;

  @IsBoolean()
  deleted: boolean;

  @IsString()
  text: string;
}
