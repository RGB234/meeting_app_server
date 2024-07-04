import { Transform } from 'class-transformer';
import { Authentication } from 'src/authentication/auth.entity';
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
  @PrimaryColumn({ type: 'char' })
  id: string;
  // Primary column name must match the relation name + join column name on related entity
  // ref. https://stackoverflow.com/questions/72764116/create-a-primary-key-for-a-one-to-one-relationship

  // %%%%%%%%%%%%%%%

  @OneToOne(() => Authentication, {
    // set cascade remove only from one side of relationship.
    cascade: true,
  })
  // @JoinColumn must only be on one side of the relation - on the table that will own the foreign key.
  // Note, inverse relation does not have a @JoinColumn.
  @JoinColumn()
  authentication: Authentication;

  // %%%%%%%%%%%%%%%

  // To CACADE delete when a user's account is deleted
  @OneToMany(() => UserToRoom, (userToRoom) => userToRoom.user, {
    // Setting cascade: true will enable full cascades.
    // ['update', 'insert', 'remove', 'soft-remove', 'recover'],
    cascade: true,
  })
  public userToRooms: UserToRoom[];

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  gender: number;

  @Transform(({ value }) => value.format('YYYY/MM/DD'))
  @Column({ type: 'date' })
  // Note that the type is string
  birthday: string;

  @Column({ type: 'varchar' })
  affiliation: string;

  @Column({ type: 'varchar' })
  account: string;

  @Column({ type: 'varchar' })
  phoneNum: string;

  @Column({ type: 'varchar' })
  photoURL: string;
}
function moment(value: any) {
  throw new Error('Function not implemented.');
}
