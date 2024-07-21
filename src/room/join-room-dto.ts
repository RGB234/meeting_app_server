import { IsNumber } from 'class-validator';

export class UserToRoomDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  roomId: number;

  //   @IsDate()
  //   joinedAt: Date;
}
