import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeleteResult, In, Repository } from 'typeorm';

import { Room } from './room.entity';
import { UserToRoom } from './userToRoom.entity';
import { UserService } from 'src/user/user.service';
import { Gender, User } from 'src/user/user.entity';
import { v4 as uuidv4 } from 'uuid';

import { CreateRoomDto } from './create-room-dto';
import { MatchCriteriaDto } from './match-room-dto';
import { UserToRoomDto } from './user-to-room-dto';
import { UpdateRoomDto } from './update-room-dto';
import { Socket } from 'socket.io';

@Injectable()
export class RoomService {
  private MAX_CAPACITY = 4;
  constructor(
    private datasource: DataSource,

    @InjectRepository(Room)
    private roomRepo: Repository<Room>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(UserToRoom)
    private userToRoomRepo: Repository<UserToRoom>,
  ) {}

  // ** fetch data **

  async getRoomById(roomId: string): Promise<Room | null> {
    if (!roomId) return null;

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
    const rooms = await this.roomRepo.find({ where: { ...criteria } });
    console.log('search result: ', rooms);
    return rooms;
  }

  generateRoomId(): string {
    return uuidv4();
  }

  async updateRoom(updateRoomDto: UpdateRoomDto) {
    const room = await this.roomRepo.findOne({
      relations: {},
      where: { id: updateRoomDto.id },
    });
    if (!room) throw new HttpException('Invalid roomId', HttpStatus.NOT_FOUND);

    // const { id, ...updateProperties } = updateRoomDto;

    const updatedRoom = this.roomRepo.create({
      ...room,
      ...updateRoomDto,
    });

    // Object.values(updatedRoom).forEach((prop) => {
    //   if (prop != undefined) {
    //     console.log('!', prop);
    //   }
    // });

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(updatedRoom);

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // Update current number of people in the room
  async refreshNumsOf(roomId: string): Promise<void> {
    const U2Rs = await this.userToRoomRepo.find({
      relations: { user: true },
      where: { roomId },
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

  async checkCapacityLimit(userId: number, roomId: string): Promise<boolean> {
    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new HttpException('Invalid userId', HttpStatus.NOT_FOUND);

    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) throw new HttpException('Invalid roomId.', HttpStatus.NOT_FOUND);

    const isFemale = user.gender == Gender.Female;
    const currentCount = isFemale ? room.femaleCount : room.maleCount;
    const maxCount = isFemale ? room.maxFemaleCount : room.maxMaleCount;

    if (currentCount >= maxCount) {
      // throw new HttpException('Maximum capacity exceeded', HttpStatus.CONFLICT);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return false;
    }
    await queryRunner.commitTransaction();
    await queryRunner.release();
    return true;
  }

  // create Join Table Record
  async createUserToRoomRecord({
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
      // console.log(`A user is already in this room (${userToRoom.roomId}).`);
      throw new HttpException(
        `A user is already in this room (${userToRoom.roomId}).`,
        HttpStatus.CONFLICT,
      );
    }

    const room = await this.roomRepo.findOne({
      relations: { userToRooms: true },
      where: { id: userToRoom.roomId },
    });
    if (!room) throw new HttpException('Invalid roomId.', HttpStatus.NOT_FOUND);

    const user = await this.userRepo.findOneBy({ id: userToRoom.userId });
    if (!user) throw new HttpException('Invalid userId', HttpStatus.NOT_FOUND);

    if (!(await this.checkCapacityLimit(user.id, room.id))) {
      throw new HttpException('Maximum capacity exceeded', HttpStatus.CONFLICT);
    }

    const U2R = this.datasource.manager.create(UserToRoom, {
      ...userToRoom,
      joinedAt: new Date(),
      user: user,
      room: room,
    });

    // await this.datasource.manager.save(U2R);

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(U2R);

      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    // Update current number of people in the room
    await this.refreshNumsOf(userToRoom.roomId);

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
  }

  async deleteUserToRoomRecord({
    userId,
    roomId,
  }: {
    userId: number;
    roomId: string; // UUID
  }): Promise<void> {
    const U2RsToDelete = await this.userToRoomRepo.findBy({
      userId,
      roomId,
    });
    if (U2RsToDelete.length == 0) {
      console.log(`userId : ${userId}, roomId : ${roomId}`);
      throw new HttpException(
        'Invalid userId or roomId.',
        HttpStatus.NOT_FOUND,
      );
    }

    const U2RIdsToDelete: number[] = U2RsToDelete.map((u2r) => u2r.id);

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(UserToRoom, U2RIdsToDelete);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    await this.refreshNumsOf(roomId);

    // -- debuging --

    // const room = await this.roomRepo.findOne({
    //   relations: {
    //     // related userToRooms entities are loaded as room.userToRooms
    //     // if this option is set false, room.userToRooms is undefined
    //     userToRooms: true,
    //   },
    //   where: { id: roomId },
    // });
    // if (!room)
    //   throw new HttpException(
    //     'Invalid roomId (NOT FOUND)',
    //     HttpStatus.NOT_FOUND,
    //   );

    // const user = await this.userRepo.findOneBy({ id: userId });
    // if (!user)
    //   throw new HttpException(
    //     'Invalid userId (NOT FOUND)',
    //     HttpStatus.NOT_FOUND,
    //   );

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
  }

  async deleteAllUserToRoomRecordsOfUser(userId: number) {
    const U2RsToDelete = await this.userToRoomRepo.findBy({ userId });
    try {
      U2RsToDelete.map(async (u2r) => {
        await this.userToRoomRepo.delete(u2r.id);
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async createRoom(createRoomDto: CreateRoomDto): Promise<string | null> {
    const room = await this.getRoomById(createRoomDto.id);
    if (room) {
      console.log(`the room ${createRoomDto.id} already exits.`);
      return;
    }

    const newRoom = this.roomRepo.create({
      ...createRoomDto,
      createdAt: new Date(),
      // userToRooms: [],
      // messages: [],
    });

    // await this.datasource.manager.save(newRoom);

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(newRoom);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    return newRoom.id;
  }

  async createRoomByCriteria(criteria: MatchCriteriaDto) {
    const createRoomDto = new CreateRoomDto();
    // allocate random UUID
    createRoomDto.id = this.generateRoomId();
    // create a new room that meet the search condition
    createRoomDto.location = criteria.location;

    const isValidMaxCount = (
      maxCount: number | null | undefined,
      maxCapacity: number,
    ): Boolean => {
      return maxCount != undefined && maxCount > 0 && maxCount <= maxCapacity;
    };

    if (isValidMaxCount(criteria.maxFemaleCount, this.MAX_CAPACITY)) {
      createRoomDto.maxFemaleCount = criteria.maxFemaleCount;
    } else {
      createRoomDto.maxFemaleCount = this.MAX_CAPACITY;
    }

    if (isValidMaxCount(criteria.maxMaleCount, this.MAX_CAPACITY)) {
      createRoomDto.maxMaleCount = criteria.maxMaleCount;
    } else {
      createRoomDto.maxMaleCount = this.MAX_CAPACITY;
    }

    const newRoomId = await this.createRoom(createRoomDto);

    return newRoomId;
  }

  // Eject all users who participated in the room
  async ejectAllUsersIn(roomId: string): Promise<DeleteResult> {
    const userToRooms = await this.userToRoomRepo.findBy({ roomId });
    if (userToRooms.length == 0) {
      return;
    }
    const ids = userToRooms.map((e) => e.id);

    // return await this.userToRoomRepo.delete({ id: In(ids) });

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(UserToRoom, ids);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  // delete a room only if it's empty
  async deleteRoom(roomId: string): Promise<void> {
    const room = await this.roomRepo.findOneBy({ id: roomId });
    if (!room) {
      throw new HttpException('Invalid roomId', HttpStatus.NOT_FOUND);
    }
    const isNotEmpty = await this.userToRoomRepo.existsBy({ roomId: roomId });
    if (isNotEmpty) {
      throw new HttpException(
        'It can be deleted only when there is no user in the room.',
        HttpStatus.NOT_FOUND,
      );
    }

    const queryRunner = this.datasource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Room, room);
      await queryRunner.commitTransaction();
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
      throw new HttpException('Invalid roomId', HttpStatus.NOT_FOUND);
    }
    const isNotEmpty = await this.userToRoomRepo.existsBy({ roomId: roomId });
    if (isNotEmpty) {
      await this.ejectAllUsersIn(roomId);
    }
    return this.roomRepo.delete(room);
  }
}
