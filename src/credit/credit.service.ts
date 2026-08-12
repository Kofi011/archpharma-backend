import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { CustomersService } from '../customers/customers.service';

export interface AgingBucketItem {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  grandTotal: number;
  balance: number;
  daysOverdue: number;
  agingBucket: 'current' | '30' | '60' | '90' | '120+';
}

@Injectable()
export class CreditService {
  constructor(
    private readonly salesService: SalesService,
    private readonly customersService: CustomersService,
  ) {}

  async getAgingAnalysis() {
    const invoices = await this.salesService.findAll();
    const unpaid = invoices.filter((i) => i.balance > 0);

    const now = new Date();
    const result: AgingBucketItem[] = [];

    let currentTotal = 0;
    let days30Total = 0;
    let days60Total = 0;
    let days90Total = 0;
    let days120PlusTotal = 0;

    for (const inv of unpaid) {
      const invDate = new Date(inv.invoiceDate);
      const dueDate = new Date(invDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let agingBucket: 'current' | '30' | '60' | '90' | '120+' = 'current';
      if (daysOverdue > 120) {
        agingBucket = '120+';
        days120PlusTotal += inv.balance;
      } else if (daysOverdue > 90) {
        agingBucket = '90';
        days90Total += inv.balance;
      } else if (daysOverdue > 60) {
        agingBucket = '60';
        days60Total += inv.balance;
      } else if (daysOverdue > 0) {
        agingBucket = '30';
        days30Total += inv.balance;
      } else {
        currentTotal += inv.balance;
      }

      result.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId || 'c-unknown',
        customerName: inv.customerName || 'Walk-in Customer',
        invoiceDate: inv.invoiceDate,
        dueDate: dueDate.toISOString().split('T')[0],
        grandTotal: inv.grandTotal,
        balance: inv.balance,
        daysOverdue,
        agingBucket,
      });
    }

    return {
      summary: {
        totalOutstanding: currentTotal + days30Total + days60Total + days90Total + days120PlusTotal,
        current: currentTotal,
        overdue30: days30Total,
        overdue60: days60Total,
        overdue90: days90Total,
        overdue120Plus: days120PlusTotal,
      },
      items: result,
    };
  }

  async getOverdueInvoices() {
    const aging = await this.getAgingAnalysis();
    return aging.items.filter((item) => item.daysOverdue > 0);
  }
}
