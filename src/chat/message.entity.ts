import { Room } from 'src/room/room.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  // FK. REFERENCES User(id). 'NO CASCADE option'
  @Column()
  writerId: number;

  // FK. REFERENCES Room(id) with DELETE CASCADE option
  @Column()
  roomId: number;

  @ManyToOne(() => User, (user) => user.messages)
  // ??
  // @JoinColumn({ name: 'writerId', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Room, (room) => room.messages)
  // ??
  // @JoinColumn({ name: 'roomId', referencedColumnName: 'id' })
  room: Room;

  @Column()
  createdAt: Date;

  @Column({ default: false })
  deleted: boolean;

  @Column()
  text: String;
}

// CREATE TABLE message (
// 	id INT AUTO_INCREMENT PRIMARY KEY,
//     writerId INT NOT NULL UNIQUE,
//     roomId INT NOT NULL UNIQUE,
//     createdAt TIMESTAMP NOT NULL,
//     deleted BIT NOT NULL,
//     text VARCHAR(255) NOT NULL,
//     CONSTRAINT fk_writer FOREIGN KEY (writerId) REFERENCES user(id),
//     CONSTRAINT fk_parentRoom FOREIGN KEY (roomId) REFERENCES room(id)
// );
