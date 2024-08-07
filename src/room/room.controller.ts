import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './create-room-dto';
import { UserToRoomDto } from './user-to-room-dto';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';
import { UUID } from 'crypto';

@Controller('room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
  ) {}

  // @Post('create')
  // @UsePipes(
  //   new ValidationPipe({
  //     transform: true,
  //     // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators.
  //     whitelist: true,
  //   }),
  // )
  // async createRoom(@Body() createRoomDto: CreateRoomDto): Promise<void> {
  //   const currentTime = new Date();
  //   const roomId = await this.roomService.createRoom(
  //     createRoomDto,
  //     currentTime,
  //   );
  // }

  @Delete('delete/:id')
  async deleteRoom(@Param('id') roomId: UUID) {
    await this.roomService.deleteRoom(roomId);
  }

  @Delete('force-delete/:id')
  async forceDeleteRoom(@Param('id') roomId: UUID) {
    await this.roomService.forceDeleteRoom(roomId);
  }

  @Post('end/:id')
  async endRoom(@Param('id') roomId: UUID) {
    await this.roomService.endRoom(roomId);
  }

  @Post('join/:id')
  async joinRoom(@Param('id') roomId: UUID, @Req() req: any) {
    const currentTime = new Date();
    const user = await this.userService.getUserByAuthId(req.user.sub);
    const u2r = new UserToRoomDto();
    u2r.roomId = roomId;
    u2r.userId = user.id;
    await this.roomService.createUserToRoomRecord({ userToRoom: u2r });
  }

  @Post('exit/:id')
  async exitRoom(@Param('id') roomId: UUID, @Req() req: any) {
    const user = await this.userService.getUserByAuthId(req.user.sub);
    this.roomService.deleteUserToRoomRecord({
      userId: user.id,
      roomId: roomId,
    });
  }
}
