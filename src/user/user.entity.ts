import { Authentication } from 'src/authentication/authentication.entity';
import { Message } from 'src/chat/message.entity';
import { UserToRoom } from 'src/room/userToRoom.entity';

import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class User {
  // PK that is both FK referencing Authentication
  // Primary column name must match the relation name + join column name on related entity
  // ref. https://stackoverflow.com/questions/72764116/create-a-primary-key-for-a-one-to-one-relationship
  @PrimaryColumn({ type: 'int' })
  uid: number;

  // Note, inverse relation does not have a @JoinColumn.
  // @JoinColumn must only be on one side of the relation - on the table that will own the foreign key.

  // This is a Uni-directional relation
  // cf. Bi-directional relations allow you to join relations from both sides using QueryBuilder:
  @OneToOne(() => Authentication, {
    cascade: true,
  })
  @JoinColumn()
  authentication: Authentication;

  @OneToMany(() => UserToRoom, (UserToRoom) => UserToRoom.user)
  public userToRooms: UserToRoom[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  gender: number;

  @Column({ type: 'datetime' })
  birthday: Date;

  @Column({ type: 'varchar' })
  affiliation: string;

  @Column({ type: 'varchar' })
  account: string;

  @Column({ type: 'varchar' })
  phoneNum: string;

  @Column({ type: 'varchar' })
  photoURL: string;
}
