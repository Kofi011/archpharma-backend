import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService, CreateInvoiceDto } from './sales.service';
import { Roles } from '../auth/roles.guard';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('invoices')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter invoices by customer or status' })
  async findAll(@Query('customerId') customerId?: string, @Query('status') status?: string) {
    return this.salesService.findAll({ customerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details by ID or invoice number' })
  async findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Create invoice with FIFO batch consumption' })
  async create(@Body() dto: CreateInvoiceDto) {
    return this.salesService.create(dto);
  }

  @Post(':id/payments')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Record payment for invoice' })
  async recordPayment(@Param('id') id: string, @Body('amount') amount: number, @Body('method') method?: string) {
    return this.salesService.recordPayment(id, amount, method);
  }
}
