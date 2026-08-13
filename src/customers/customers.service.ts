import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

export interface CreateCustomerDto {
  businessName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: number;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAll(search?: string): Promise<Customer[]> {
    if (search) {
      const q = `%${search.toLowerCase()}%`;
      return this.customerRepository.createQueryBuilder('customer')
        .where('LOWER(customer.businessName) LIKE :q OR LOWER(customer.contactPerson) LIKE :q OR customer.phone LIKE :q', { q })
        .orderBy('customer.createdAt', 'DESC')
        .getMany();
    }
    return this.customerRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Customer> {
    const c = await this.customerRepository.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Customer ${id} not found`);
    return c;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const newCustomer = this.customerRepository.create({
      ...dto,
      outstandingBalance: 0.00,
      status: 'active',
      syncStatus: 'synced',
    });
    return this.customerRepository.save(newCustomer);
  }

  async update(id: string, dto: Partial<CreateCustomerDto>): Promise<Customer> {
    const customer = await this.findOne(id);
    this.customerRepository.merge(customer, dto);
    return this.customerRepository.save(customer);
  }

  async getStatement(id: string) {
    const customer = await this.findOne(id);
    const balance = Number(customer.outstandingBalance);
    const limit = Number(customer.creditLimit);
    return {
      customer,
      statementDate: new Date().toISOString(),
      totalInvoiced: balance + 2500.0,
      totalPaid: 2500.0,
      outstandingBalance: balance,
      availableCredit: limit - balance,
      transactions: [
        { date: '2026-07-09', type: 'Invoice', ref: 'INV-2026-0709', amount: 235.0, status: 'Completed' },
      ],
    };
  }

  async clearAll() {
    try {
      await this.customerRepository.delete({});
    } catch (_) {
      try {
        await this.customerRepository.clear();
      } catch (_) {}
    }
  }
}


