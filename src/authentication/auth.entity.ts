import { Exclude } from 'class-transformer';
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

  // constructor(partial: Partial<Authentication>) {
  //   Object.assign(this, partial);
  // }
}
