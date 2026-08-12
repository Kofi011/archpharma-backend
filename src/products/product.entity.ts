import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true, nullable: true })
  barcode: string;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ name: 'generic_name', length: 255, nullable: true })
  genericName: string;

  @Column({ name: 'brand_name', length: 255, nullable: true })
  brandName: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 255, nullable: true })
  manufacturer: string;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ name: 'cost_price', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  costPrice: number;

  @Column({ name: 'selling_price', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
  sellingPrice: number;

  @Column({ name: 'reorder_level', type: 'integer', default: 10 })
  reorderLevel: number;

  @Column({ length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
