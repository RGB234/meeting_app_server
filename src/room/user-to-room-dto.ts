import { IsNumber, IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class UserToRoomDto {
  @IsNumber()
  userId: number;

  @IsString()
  roomId: string;

  //   @IsDate()
  //   joinedAt: Date;
}
