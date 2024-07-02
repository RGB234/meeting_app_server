import { UUID } from 'crypto';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
export class Authentication {
  // Uuid is a unique string id. You don't have to manually assign its value before save - value will be automatically generated.
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;
}
