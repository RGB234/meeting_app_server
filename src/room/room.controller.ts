import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './create-room-dto';
import { Room } from './room.entity';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('create')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
      whitelist: true,
    }),
  )
  async postRoom(@Body() createRoomDto: CreateRoomDto): Promise<void> {
    const currentTime = new Date();
    const roomId = await this.roomService.createRoom(
      createRoomDto,
      currentTime,
    );
    await this.roomService.joinRoom({
      userId: createRoomDto.managerId,
      roomId: roomId,
      joinedAt: currentTime,
    });
  }
}
