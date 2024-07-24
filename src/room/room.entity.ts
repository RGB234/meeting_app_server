import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserToRoom } from './userToRoom.entity';
import { Message } from 'src/chat/message.entity';
import { IsString, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export enum Area {
  수원시_장안구 = '수원시 장안구',
  수원시_권선구 = '수원시 권선구',
  수원시_팔달구 = '수원시 팔달구',
  수원시_영통구 = '수원시 영통구',
}

@Entity()
export class Room {
  // bigint column type, used in SQL databases, doesn't fit into the regular number type and maps property to a string instead.
  // @PrimaryGeneratedColumn({ type: 'var' })
  @IsString()
  @PrimaryColumn()
  id: string;

  @OneToMany(() => UserToRoom, (UserToRoom) => UserToRoom.room, {
    cascade: true,
  })
  public userToRooms: UserToRoom[];

  @OneToMany(() => Message, (message) => message.room)
  public messages: Message[];

  // ****************
  @Column()
  location: Area;
  // ****************

  @Column()
  createdAt: Date;

  @Column()
  maxMaleCount: number;

  @Column()
  maxFemaleCount: number;
}

// CREATE TABLE room (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   managerID CHAR(36) NOT NULL,
//   createdAt TIMESTAMP NOT NULL,
//   title VARCHAR(255) NOT NULL,
//   maxMaleCount INT NOT NULL,
//   maxFemaleCount INT NOT NULL
// );
