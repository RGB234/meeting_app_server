import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, In, Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './create-room-dto';
import { UserToRoom } from './userToRoom.entity';
import { UserService } from 'src/user/user.service';
import { Gender, User } from 'src/user/user.entity';
import { Socket } from 'socket.io';
import { FindRoomOptionDto } from './match-criteria-dto';

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

  async getRoomById(roomId: number): Promise<Room | null> {
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

  async getRoomsByCriteria(criteria: FindRoomOptionDto): Promise<Room[]> {
    const room = await this.roomRepo.findBy({ ...criteria });
    return room;
  }

  // create Join Table Record
  async joinRoom({
    userId,
    roomId,
    joinedAt,
  }: {
    userId: number;
    roomId: number;
    joinedAt: Date;
  }): Promise<UserToRoom> {
    const isValidRoomId = await this.roomRepo.existsBy({ id: roomId });
    const isValidUserId = await this.userRepo.existsBy({ id: userId });

    if (!isValidRoomId) throw new BadRequestException('Invalid roomId.');
    if (!isValidUserId) throw new BadRequestException('Invalid userId');

    const userToRoom = new UserToRoom();
    userToRoom.userId = userId;
    userToRoom.roomId = roomId;
    userToRoom.joinedAt = joinedAt;
    userToRoom.user = await this.userService.getUserById(userId);
    userToRoom.room = await this.getRoomById(roomId);

    const room = await this.getRoomById(roomId);
    room.userToRooms = [userToRoom];

    return await this.userToRoomRepo.save(userToRoom);
  }

  async exitRoom({
    userId,
    roomId,
  }: {
    userId: number;
    roomId: number;
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
  ): Promise<number> {
    const newRoom = this.roomRepo.create({
      ...createRoomDto,
      id: client.data.roomId,
      createdAt: createdAt,
      userToRooms: [],
      messages: [],
    });

    await this.datasource.manager.save(newRoom);
    return newRoom.id;
  }

  // Eject all users who participated in the room
  async ejectAllUsersIn(roomId: number): Promise<DeleteResult> {
    const userToRooms = await this.userToRoomRepo.findBy({ roomId });
    if (userToRooms.length == 0) {
      return;
      // throw new BadRequestException('the room is already empty');
    }
    const ids = userToRooms.map((e) => e.id);

    return await this.userToRoomRepo.delete({ id: In(ids) });
  }

  // delete a room only if it's empty
  async deleteRoom(roomId: number): Promise<DeleteResult> {
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
  async endRoom(roomId: number): Promise<boolean> {
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
  async forceDeleteRoom(roomId: number): Promise<DeleteResult> {
    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) {
      throw new BadRequestException('Invalid roomId');
    }
    const isNotEmpty = await this.userToRoomRepo.existsBy({ id: roomId });
    if (isNotEmpty) {
      await this.ejectAllUsersIn(roomId);
    }
    return this.roomRepo.delete(room);
  }
}
