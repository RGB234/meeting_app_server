import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './create-room-dto';
import { UserToRoom } from './userToRoom.entity';
import { UserService } from 'src/user/user.service';
import { Message } from 'src/chat/message.entity';

@Injectable()
export class RoomService {
  constructor(
    private datasource: DataSource,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    // @InjectRepository(User)
    // private userRepository : Repository<User>,

    private userService: UserService,
  ) {}

  async getRoomById(roomId: number): Promise<Room | null> {
    return this.roomRepository.findOneBy({ id: roomId });
  }

  async joinRoom({
    // create Join Table Record
    userId,
    roomId,
    joinedAt,
  }: {
    userId: number;
    roomId: number;
    joinedAt: Date;
  }): Promise<UserToRoom> {
    const userToRoom = new UserToRoom();
    userToRoom.userId = userId;
    userToRoom.roomId = roomId;
    userToRoom.joinedAt = joinedAt;
    userToRoom.user = await this.userService.getUserById(userId);
    userToRoom.room = await this.getRoomById(roomId);

    const room = await this.getRoomById(roomId);
    room.userToRooms = [userToRoom];

    return await this.datasource.manager.save(userToRoom);
  }

  async createRoom(
    createRoomDto: CreateRoomDto,
    createdAt: Date,
  ): Promise<number> {
    // const manager = await this.userService.getUserById(createRoomDto.managerID);
    const newRoom = this.roomRepository.create({
      ...createRoomDto,
      createdAt: createdAt,
      userToRooms: [],
      messages: [],
    });

    await this.datasource.manager.save(newRoom);
    return newRoom.id;
  }
}
