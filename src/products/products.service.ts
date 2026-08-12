import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

export interface CreateProductDto {
  barcode?: string;
  productName: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  manufacturer?: string;
  supplierId?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(query?: { search?: string; category?: string; status?: string }) {
    const qb = this.productRepository.createQueryBuilder('product');

    if (query?.search) {
      const s = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(product.productName) LIKE :s OR LOWER(product.genericName) LIKE :s OR product.barcode LIKE :s)',
        { s },
      );
    }
    if (query?.category) {
      qb.andWhere('LOWER(product.category) = :category', { category: query.category.toLowerCase() });
    }
    if (query?.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    qb.orderBy('product.createdAt', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const p = await this.productRepository.findOne({ where: { id } });
    if (!p) throw new NotFoundException(`Product with ID ${id} not found`);
    return p;
  }

  async findByBarcode(barcode: string): Promise<Product> {
    const p = await this.productRepository.findOne({ where: { barcode } });
    if (!p) throw new NotFoundException(`Product with barcode ${barcode} not found`);
    return p;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const barcode = dto.barcode || `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
    const newProduct = this.productRepository.create({
      ...dto,
      barcode,
      status: 'active',
    });
    return this.productRepository.save(newProduct);
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.findOne(id);
    this.productRepository.merge(product, dto);
    return this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { message: `Product ${id} deleted successfully` };
  }
}
