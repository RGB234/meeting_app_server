import {
  Body,
  Controller,
  Delete,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './create-room-dto';
import { UserToRoomDto } from './join-room-dto';

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
  async createRoom(@Body() createRoomDto: CreateRoomDto): Promise<void> {
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

  @Post('join')
  @UsePipes()
  async joinRoom(@Body() userToRoomDto: UserToRoomDto) {
    const currentTime = new Date();
    await this.roomService.joinRoom({
      userId: userToRoomDto.userId,
      roomId: userToRoomDto.roomId,
      joinedAt: currentTime,
    });
  }

  @Post('exit')
  @UsePipes()
  async exitRoom(@Body() userToRoomDto: UserToRoomDto) {
    this.roomService.exitRoom({
      userId: userToRoomDto.userId,
      roomId: userToRoomDto.roomId,
    });
  }
}
