import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditService } from './credit.service';

@ApiTags('Credit')
@ApiBearerAuth()
@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Get('aging')
  @ApiOperation({ summary: 'Get customer debt aging analysis breakdown (Current / 30 / 60 / 90+ days)' })
  async getAgingAnalysis() {
    return this.creditService.getAgingAnalysis();
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get list of overdue credit invoices' })
  async getOverdueInvoices() {
    return this.creditService.getOverdueInvoices();
  }
}
