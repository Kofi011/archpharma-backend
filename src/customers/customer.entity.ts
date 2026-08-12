import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_name', length: 255 })
  businessName: string;

  @Column({ name: 'contact_person', length: 255, nullable: true })
  contactPerson: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'credit_limit', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  creditLimit: number;

  @Column({ name: 'outstanding_balance', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  outstandingBalance: number;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ name: 'sync_status', length: 20, default: 'synced' })
  syncStatus: 'pending' | 'synced' | 'conflict';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
