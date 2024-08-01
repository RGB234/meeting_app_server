import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, In, Repository, Transaction } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto, MatchCriteriaDto } from './create-room-dto';
import { UserToRoom } from './userToRoom.entity';
import { UserService } from 'src/user/user.service';
import { Gender, User } from 'src/user/user.entity';
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
  }): Promise<void> {
    const u2r = await this.userToRoomRepo.existsBy({
      userId: userToRoom.userId,
      roomId: userToRoom.roomId,
    });

    // already a user is in this room
    if (u2r) {
      console.log(`A user is already in this room (${userToRoom.roomId}).`);
      return;
      // throw new BadRequestException('A user is already in this room.');
    }

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

    if (room.userToRooms) {
      room.userToRooms.push(U2R);
    } else {
      room.userToRooms = [U2R];
    }

    console.log('room.userToRooms');
    console.log(room.userToRooms);
    // room.userToRooms = [U2R];

    if (user.gender == Gender.Female) {
      room.femaleCount += 1;
      if (room.femaleCount >= room.maxFemaleCount)
        throw new BadRequestException('Capacity exceeded');
    } else if (user.gender == Gender.Male) {
      room.maleCount += 1;
      if (room.maleCount >= room.maxMaleCount)
        throw new BadRequestException('Capacity exceeded');
    } else {
      throw new BadRequestException('invalid user gender property value');
    }

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.datasource.manager.save(U2R);
      await this.datasource.manager.save(room);
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async exitRoom({
    userId,
    roomId,
  }: {
    userId: number;
    roomId: UUID;
  }): Promise<void> {
    const u2rToDelete = await this.userToRoomRepo.findOneBy({
      userId,
      roomId,
    });
    if (!u2rToDelete) {
      console.log(`userId : ${userId}, roomId : ${roomId}`);
      throw new BadRequestException('Invalid userId or roomId.');
    }

    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) throw new BadRequestException('Invalid roomId (NOT FOUND)');

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('Invalid userId (NOT FOUND)');

    if (user.gender == Gender.Female) {
      room.femaleCount -= 1;
    } else if (user.gender == Gender.Male) {
      room.maleCount -= 1;
    } else {
      throw new BadRequestException('invalid user gender property value');
    }

    if (room.userToRooms) {
      room.userToRooms = room.userToRooms.filter((userToRoom) => {
        return userToRoom.id !== u2rToDelete.id;
      });
    }

    console.log(`u2rs : ${room.userToRooms}`);

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.datasource.manager.delete(UserToRoom, u2rToDelete.id);

      if (room.femaleCount == 0 && room.maleCount == 0) {
        // No user left -> delete this empty room
        await this.datasource.manager.delete(Room, room.id);
      } else {
        await this.datasource.manager.save(room);
      }
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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

    return this.datasource.manager.delete(Room, room.id);
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
