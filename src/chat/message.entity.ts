import { Room } from 'src/room/room.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryColumn()
  msgID: number;

  // @Column()
  // roomID: number;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  // @Column()
  // writerID: number;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @Column()
  createdAt: Date;

  @Column({ default: false })
  deleted: boolean;

  @Column()
  text: String;
}
