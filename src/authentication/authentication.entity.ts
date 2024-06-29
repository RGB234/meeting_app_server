import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Authentication {
  // Uuid is a unique string id. You don't have to manually assign its value before save - value will be automatically generated.
  @PrimaryGeneratedColumn('uuid')
  uid: number;

  @Column({ type: 'string' })
  email: string;

  @Column({ type: 'string' })
  password: string;
}
