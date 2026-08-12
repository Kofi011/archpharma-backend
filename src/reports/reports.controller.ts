import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Get daily or monthly sales revenue breakdown' })
  async getSalesReport(@Query('period') period?: 'daily' | 'monthly') {
    return this.reportsService.getSalesReport(period);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top fast-moving products by revenue & volume' })
  async getTopProducts() {
    return this.reportsService.getTopProducts();
  }

  @Get('profitability')
  @ApiOperation({ summary: 'Get gross profit margins per product category' })
  async getProfitabilityReport() {
    return this.reportsService.getProfitabilityReport();
  }

  @Get('expiry-risk')
  @ApiOperation({ summary: 'Get expiry loss risk report for batches expiring in 90 days' })
  async getExpiryRiskReport() {
    return this.reportsService.getExpiryRiskReport();
  }
}
