import { Exclude } from 'class-transformer';
import { User } from 'src/user/user.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Authentication {
  // Uuid is a unique string id. You don't have to manually assign its value before save - value will be automatically generated.
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  // 'password' property is excluded from the response
  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @Exclude()
  @Column({ type: 'varchar', default: null })
  refreshToken: string;

  // Authenticaion (parent) <-Ref- User (child)
  @OneToOne(() => User, (user) => user.authentication, {
    // Setting cascade: true will enable full cascades.
    // ['update', 'insert', 'remove', 'soft-remove', 'recover'],
    cascade: true,
  })
  user: User;
}
