import { Injectable } from '@nestjs/common';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly salesService: SalesService,
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
  ) {}

  async getSalesReport(period: 'daily' | 'monthly' = 'daily') {
    const invoices = await this.salesService.findAll();
    const totalSales = invoices.reduce((acc, i) => acc + i.grandTotal, 0);
    const totalCollected = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
    const totalReceivable = invoices.reduce((acc, i) => acc + i.balance, 0);

    return {
      period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalInvoices: invoices.length,
        totalSales,
        totalCollected,
        totalReceivable,
        averageInvoiceValue: invoices.length > 0 ? totalSales / invoices.length : 0,
      },
    };
  }

  async getTopProducts() {
    return [
      { productId: 'p-1001', productName: 'Tacrolin 0.1% Ointment', category: 'Dermatology', totalUnitsSold: 120, totalRevenue: 28200.00 },
      { productId: 'p-1002', productName: 'Amoxicillin 500mg Capsules', category: 'Antibiotics', totalUnitsSold: 450, totalRevenue: 20250.00 },
      { productId: 'p-1003', productName: 'Paracetamol 500mg Tablets', category: 'Analgesics', totalUnitsSold: 1200, totalRevenue: 18000.00 },
    ];
  }

  async getProfitabilityReport() {
    const products = await this.productsService.findAll();
    const items = products.map((p) => ({
      productId: p.id,
      productName: p.productName,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      marginGhs: p.sellingPrice - p.costPrice,
      marginPercent: ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100,
    }));

    const avgMarginPercent = items.reduce((acc, i) => acc + i.marginPercent, 0) / (items.length || 1);

    return {
      averageMarginPercent: avgMarginPercent.toFixed(2),
      items,
    };
  }

  async getExpiryRiskReport() {
    const alerts = await this.inventoryService.getAlerts();
    const totalAtRiskValue = alerts.nearExpiryBatches.reduce((acc, b) => acc + b.quantity * b.purchaseCost, 0);
    const totalExpiredValue = alerts.expiredBatches.reduce((acc, b) => acc + b.quantity * b.purchaseCost, 0);

    return {
      nearExpiryCount: alerts.nearExpiryBatches.length,
      nearExpiryValueGhs: totalAtRiskValue,
      expiredCount: alerts.expiredBatches.length,
      expiredValueGhs: totalExpiredValue,
      batches: alerts.nearExpiryBatches,
    };
  }
}
