import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService, CreateProductDto } from './products.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard, Roles } from '../auth/roles.guard';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Search products by barcode, text search, or category filter' })
  async findAll(@Query('search') search?: string, @Query('category') category?: string) {
    return this.productsService.findAll({ search, category });
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Lookup product by barcode' })
  async findByBarcode(@Param('barcode') barcode: string) {
    return this.productsService.findByBarcode(barcode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'storekeeper')
  @ApiOperation({ summary: 'Create new product' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'storekeeper')
  @ApiOperation({ summary: 'Update product details' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateProductDto>) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
