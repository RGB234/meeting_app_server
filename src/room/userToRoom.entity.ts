import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Rooms } from './room.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class UserToRoom {
  @PrimaryColumn()
  public uid: number;

  @PrimaryColumn()
  public roomID: number;

  @Column()
  public joinedAt: Date;

  @ManyToOne(() => User, (user) => user.userToRooms)
  public user: User;

  @ManyToOne(() => Rooms, (room) => room.userToRooms)
  public room: Rooms;
}
