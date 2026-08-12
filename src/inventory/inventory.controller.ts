import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService, StockInDto } from './inventory.service';
import { Roles } from '../auth/roles.guard';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock/:productId')
  @ApiOperation({ summary: 'Get calculated current stock from append-only ledger' })
  async getCalculatedStock(@Param('productId') productId: string) {
    const stock = await this.inventoryService.getCalculatedStock(productId);
    return { productId, calculatedStock: stock };
  }

  @Get('batches')
  @ApiOperation({ summary: 'Get batches in FIFO order (earliest expiry first)' })
  async getBatches(@Query('productId') productId?: string) {
    return this.inventoryService.getBatches(productId);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get stock movement audit ledger' })
  async getStockLedger(@Query('productId') productId?: string) {
    return this.inventoryService.getStockLedger(productId);
  }

  @Post('stock-in')
  @Roles('admin', 'storekeeper')
  @ApiOperation({ summary: 'Stock-in flow: add new batch & append to stock movements ledger' })
  async stockIn(@Body() dto: StockInDto) {
    return this.inventoryService.stockIn(dto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock, near expiry (90d), and expired alerts' })
  async getAlerts() {
    return this.inventoryService.getAlerts();
  }
}
