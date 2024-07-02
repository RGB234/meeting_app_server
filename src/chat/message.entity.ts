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
  // @PrimaryGeneratedColumn()
  // id: number;

  // @Column()
  // roomID: number;

  @PrimaryColumn({ type: 'varchar' })
  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  // @Column()
  // writerID: number;

  @PrimaryColumn({ type: 'varchar' })
  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: 'writer', referencedColumnName: 'authentication' })
  user: User;

  @Column()
  createdAt: Date;

  @Column({ default: false })
  deleted: boolean;

  @Column()
  text: String;
}
