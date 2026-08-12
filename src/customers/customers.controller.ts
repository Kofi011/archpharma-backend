import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService, CreateCustomerDto } from './customers.service';
import { Roles } from '../auth/roles.guard';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List and search wholesale customers' })
  async findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by ID' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/statement')
  @ApiOperation({ summary: 'Get customer account statement and credit summary' })
  async getStatement(@Param('id') id: string) {
    return this.customersService.getStatement(id);
  }

  @Post()
  @Roles('admin', 'cashier', 'accountant')
  @ApiOperation({ summary: 'Create new customer profile' })
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update customer contact or credit limit' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customersService.update(id, dto);
  }
}
