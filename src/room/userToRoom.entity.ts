import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class UserToRoom {
  // @PrimaryColumn()
  // public uid: number;

  // @PrimaryColumn()
  // public roomID: number;

  @PrimaryColumn()
  @ManyToOne(() => User, (user) => user.userToRooms)
  // When we set @JoinColumn, it automatically creates a column in the database named propertyName + referencedColumnName
  // By default your relation always refers to the primary column of the related entity.
  // If you want to create relation with other columns of the related entity - you can specify them in @JoinColumn as well:
  @JoinColumn({ name: 'uid', referencedColumnName: 'uid' })
  public user: User;

  @PrimaryColumn()
  @ManyToOne(() => Room, (room) => room.userToRooms)
  @JoinColumn({ name: 'roomID', referencedColumnName: 'roomID' })
  public room: Room;

  @Column()
  public joinedAt: Date;
}
