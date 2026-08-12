import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  role: 'admin' | 'cashier' | 'storekeeper' | 'accountant';

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
