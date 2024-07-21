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
  public messages: Message[];

  // // NOT FK. No need to use FK because User(id) never changes
  // @Column()
  // managerId: number;

  @Column()
  createdAt: Date;

  // @Column()
  // title: String;

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
