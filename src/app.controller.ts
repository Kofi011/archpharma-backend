import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root System Status')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Backend API Health & Welcome Status' })
  getSystemStatus() {
    return {
      status: 'online',
      system: 'ArchPharma Wholesale ERP API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/api/v1/docs',
      endpoints: {
        auth: '/api/v1/auth',
        products: '/api/v1/products',
        inventory: '/api/v1/inventory',
        customers: '/api/v1/customers',
        sales: '/api/v1/sales',
        credit: '/api/v1/credit',
        reports: '/api/v1/reports',
        sync: '/api/v1/sync',
      },
    };
  }
}
