import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
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
import { UpdateRoomDto } from './update-room-dto';

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

  async updateRoom(updateRoomDto: UpdateRoomDto) {
    const room = await this.roomRepo.findOneBy({ id: updateRoomDto.id });
    if (!room) throw new BadRequestException('Invalid roomId');

    const { id, ...updateProperties } = updateRoomDto;
    try {
      await this.roomRepo.update({ id: id }, updateProperties);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Update current number of people in the room
  async refreshNumsOf(roomId: string): Promise<void> {
    const U2Rs = await this.userToRoomRepo.find({
      relations: { user: true },
      where: { roomId: roomId },
    });
    const users = U2Rs.map((u2r) => {
      return u2r.user;
    });

    let femaleCount = 0;
    let maleCount = 0;
    users.forEach((user) => {
      if (user.gender == Gender.Female) {
        femaleCount++;
      } else if (user.gender == Gender.Male) {
        maleCount++;
      }
    });

    console.log(`count of F/M : ${femaleCount} / ${maleCount}`);
    const updateRoomDto = new UpdateRoomDto();
    updateRoomDto.id = roomId;
    updateRoomDto.femaleCount = femaleCount;
    updateRoomDto.maleCount = maleCount;
    await this.updateRoom(updateRoomDto);
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
    const u2r = await this.userToRoomRepo.findOneBy({
      userId: userToRoom.userId,
      roomId: userToRoom.roomId,
    });

    // already a user is in this room
    if (u2r) {
      console.log(`A user is already in this room (${userToRoom.roomId}).`);
      return;
    }

    const room = await this.roomRepo.findOne({
      relations: { userToRooms: true },
      where: { id: userToRoom.roomId },
    });
    const user = await this.userRepo.findOneBy({ id: userToRoom.userId });

    if (!room) throw new BadRequestException('Invalid roomId.');
    if (!user) throw new BadRequestException('Invalid userId');

    const U2R = this.datasource.manager.create(UserToRoom, {
      ...userToRoom,
      joinedAt: new Date(),
      user: user,
      room: room,
    });

    await this.datasource.manager.save(U2R);

    // console.log(
    //   await this.roomRepo.findOne({
    //     relations: { userToRooms: true },
    //     where: { id: U2R.roomId },
    //   }),
    // );

    // console.log(
    //   await this.userRepo.findOne({
    //     relations: { userToRooms: true },
    //     where: { id: U2R.userId },
    //   }),
    // );

    // Update current number of people in the room
    await this.refreshNumsOf(userToRoom.roomId);
  }

  async exitRoom({
    userId,
    roomId,
  }: {
    userId: number;
    roomId: string; // UUID
  }): Promise<void> {
    const u2rToDelete = await this.userToRoomRepo.findOneBy({
      userId,
      roomId,
    });
    if (!u2rToDelete) {
      console.log(`userId : ${userId}, roomId : ${roomId}`);
      throw new BadRequestException('Invalid userId or roomId.');
    }

    const room = await this.roomRepo.findOne({
      relations: {
        // related userToRooms entities are loaded as room.userToRooms
        // if this option is set false, room.userToRooms is undefined
        userToRooms: true,
      },
      where: { id: roomId },
    });
    if (!room) throw new BadRequestException('Invalid roomId (NOT FOUND)');

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('Invalid userId (NOT FOUND)');

    // if (user.gender == Gender.Female) {
    //   room.femaleCount -= 1;
    // } else if (user.gender == Gender.Male) {
    //   room.maleCount -= 1;
    // } else {
    //   throw new BadRequestException('invalid user gender property value');
    // }

    await this.datasource.manager.delete(UserToRoom, u2rToDelete);

    // console.log(
    //   await this.roomRepo.findOne({
    //     relations: { userToRooms: true },
    //     where: { id: u2rToDelete.roomId },
    //   }),
    // );

    // console.log(
    //   await this.userRepo.findOne({
    //     relations: { userToRooms: true },
    //     where: { id: u2rToDelete.userId },
    //   }),
    // );

    await this.refreshNumsOf(roomId);

    // const queryRunner = this.datasource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    // try {
    //   // due to FK restriction, this transaction must be in this order
    //   await queryRunner.manager.delete(UserToRoom, u2rToDelete.id);
    //   // await queryRunner.manager.save(room);
    //   // if (room.femaleCount == 0 && room.maleCount == 0) {
    //   //   // No user left -> delete this empty room
    //   //   await queryRunner.manager.delete(Room, room.id);
    //   // }
    // } catch (err) {
    //   console.log(err);
    //   await queryRunner.rollbackTransaction();
    //   throw err;
    // } finally {
    //   await queryRunner.release();
    // }
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
  async deleteRoom(roomId: string): Promise<void> {
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

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Room, room);
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    // return this.datasource.manager.delete(Room, room.id);
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
