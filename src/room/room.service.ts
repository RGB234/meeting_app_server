import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './create-room-dto';

@Injectable()
export class RoomService {
  constructor(
    private datasource: DataSource,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async createRoom(createdRoomDto: CreateRoomDto): Promise<Room> {
    const newRoom = new Room();
    newRoom.managerID = createdRoomDto.managerID;
    newRoom.title = createdRoomDto.title;
    newRoom.createdAt = createdRoomDto.createdAt;
    newRoom.maxFemaleCount = createdRoomDto.maxFemaleCount;
    newRoom.maxMaleCount = createdRoomDto.maxMaleCount;

    return await this.datasource.manager.save(newRoom);
  }
}
