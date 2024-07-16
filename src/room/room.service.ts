import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './create-room-dto';
import { UserToRoom } from './userToRoom.entity';
import { UserService } from 'src/user/user.service';

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

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    const manager = await this.userService.getUserByAuthId(
      createRoomDto.managerID,
    );
    const currentTime = new Date();

    const newRoom = this.roomRepository.create({
      ...createRoomDto,
      createdAt: currentTime,
      userToRooms: [],
      messages: [],
    });

    const userToRoom = new UserToRoom();
    (userToRoom.userId = createRoomDto.managerID),
      (userToRoom.roomId = newRoom.id),
      (userToRoom.joinedAt = currentTime),
      (userToRoom.user = manager);
    userToRoom.room = newRoom;

    // newRoom.userToRooms 에 위에서 정의한 mapping 추가
    newRoom.userToRooms.push(userToRoom);

    return await this.datasource.manager.save(newRoom);
  }
}
