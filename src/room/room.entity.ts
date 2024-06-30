import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserToRoom } from './userToRoom.entity';
import { Message } from 'src/chat/message.entity';

@Entity()
export class Room {
  // bigint column type, used in SQL databases, doesn't fit into the regular number type and maps property to a string instead.
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @OneToMany(() => UserToRoom, (UserToRoom) => UserToRoom.room, {
    cascade: true,
  })
  public userToRooms: UserToRoom[];

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @Column()
  managerID: number;

  @Column()
  createdAt: Date;

  @Column()
  title: String;

  @Column()
  maxMaleCount: number;

  @Column()
  maxFemaleCount: number;
}
