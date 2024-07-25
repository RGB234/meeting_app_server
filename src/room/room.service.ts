import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, In, Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto, MatchCriteriaDto } from './create-room-dto';
import { UserToRoom } from './userToRoom.entity';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.entity';
import { Socket } from 'socket.io';
import { UserToRoomDto } from './user-to-room-dto';
import { UUID } from 'crypto';

@Injectable()
export class RoomService {
  constructor(
    private datasource: DataSource,

    @InjectRepository(Room)
    private roomRepo: Repository<Room>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserToRoom)
    private userToRoomRepo: Repository<UserToRoom>,

    private userService: UserService,
  ) {}

  // ** fetch data **

  async getRoomById(roomId: string): Promise<Room | null> {
    return await this.roomRepo.findOneBy({ id: roomId });
  }

  async getAllJoinedRooms(userId: number) {
    const [userToRooms, count] = await this.userToRoomRepo.findAndCountBy({
      userId,
    });
    const joinedRooms = userToRooms.map((e) => e.roomId); // number[]

    if (joinedRooms.length == 0) return [];

    return this.roomRepo.findBy({ id: In(joinedRooms) });
  }

  async getRoomsByCriteria(criteria: MatchCriteriaDto): Promise<Room[]> {
    const room = await this.roomRepo.findBy({ ...criteria });
    return room;
  }

  // create Join Table Record
  async joinRoom({
    userToRoom,
    // userId,
    // roomId,
    // joinedAt,
  }: {
    userToRoom: UserToRoomDto;
    // userId: number;
    // roomId: number;
    // joinedAt: Date;
  }): Promise<UserToRoom> {
    const room = await this.roomRepo.findOneBy({ id: userToRoom.roomId });
    const user = await this.userRepo.findOneBy({ id: userToRoom.userId });

    if (!room) throw new BadRequestException('Invalid roomId.');
    if (!user) throw new BadRequestException('Invalid userId');

    const U2R = this.userToRoomRepo.create({
      ...userToRoom,
      joinedAt: new Date(),
      user: user,
      room: room,
    });
    // const userToRoom = new UserToRoom();
    // userToRoom.userId = userId;
    // userToRoom.roomId = roomId;
    // userToRoom.joinedAt = joinedAt;
    // userToRoom.user = await this.userService.getUserById(userId);
    // userToRoom.room = await this.getRoomById(roomId);

    room.userToRooms = [U2R];

    return await this.userToRoomRepo.save(userToRoom);
  }

  async exitRoom({
    userId,
    roomId,
  }: {
    userId: number;
    roomId: UUID;
  }): Promise<DeleteResult> {
    const userToRoom = await this.userToRoomRepo.findOneBy({
      userId,
      roomId,
    });
    if (!userToRoom) {
      throw new BadRequestException('Invalid userId or roomId.');
    }
    return this.userToRoomRepo.delete(userToRoom);
  }

  async createRoom(
    client: Socket,
    createRoomDto: CreateRoomDto,
    createdAt: Date,
  ): Promise<string> {
    const newRoom = this.roomRepo.create({
      ...createRoomDto,
      // id: client.data.roomId,
      createdAt: createdAt,
      userToRooms: [],
      messages: [],
    });

    await this.datasource.manager.save(newRoom);
    return newRoom.id;
  }

  // Eject all users who participated in the room
  async ejectAllUsersIn(roomId: string): Promise<DeleteResult> {
    const userToRooms = await this.userToRoomRepo.findBy({ roomId });
    if (userToRooms.length == 0) {
      return;
      // throw new BadRequestException('the room is already empty');
    }
    const ids = userToRooms.map((e) => e.id);

    return await this.userToRoomRepo.delete({ id: In(ids) });
  }

  // delete a room only if it's empty
  async deleteRoom(roomId: string): Promise<DeleteResult> {
    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) {
      throw new BadRequestException('Invalid roomId');
    }
    const isNotEmpty = await this.userToRoomRepo.existsBy({ roomId: roomId });
    if (isNotEmpty) {
      throw new BadRequestException(
        'It can be deleted only when there is no user in the room.',
      );
    }

    return this.roomRepo.delete(room);
  }

  // ejectAllUsers & deleteRoom
  async endRoom(roomId: string): Promise<boolean> {
    try {
      await this.ejectAllUsersIn(roomId);
      await this.deleteRoom(roomId);
    } catch (e) {
      throw e;
    }
    return true;
  }

  // For development or test convenience
  // Delete a room. If it's not empty room, forcibly eject all Users in the room.
  async forceDeleteRoom(roomId: string): Promise<DeleteResult> {
    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) {
      throw new BadRequestException('Invalid roomId');
    }
    const isNotEmpty = await this.userToRoomRepo.existsBy({ roomId: roomId });
    if (isNotEmpty) {
      await this.ejectAllUsersIn(roomId);
    }
    return this.roomRepo.delete(room);
  }
}
