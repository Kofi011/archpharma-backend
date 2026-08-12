import { Module } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreditController } from './credit.controller';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [SalesModule, CustomersModule],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
