import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from './room.entity';
import { User } from 'src/user/user.entity';

// explicitly set table name
@Entity('user_to_room')
export class UserToRoom {
  @PrimaryGeneratedColumn()
  public id: number;

  // FK. REFERENCES User(id) with DELETE CASCADE
  @Column()
  public userId: number;

  // FK. REFERENCES Room(id) with DELETE CACADE
  @Column()
  public roomId: number;

  @Column()
  public joinedAt: Date;

  @ManyToOne(() => User, (user) => user.userToRooms)
  public user: User;

  @ManyToOne(() => Room, (room) => room.userToRooms)
  public room: Room;
}

// CREATE TABLE user_to_room (
// 	id INT AUTO_INCREMENT PRIMARY KEY,
//     userId INT NOT NULL,
//     roomId INT NOT NULL,
//     joinedAt TIMESTAMP NOT NULL,
//     CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES user(id)
// 		ON DELETE CASCADE,
//     CONSTRAINT fk_room FOREIGN KEY (roomId) REFERENCES room(id)
// 		ON DELETE CASCADE
// );
