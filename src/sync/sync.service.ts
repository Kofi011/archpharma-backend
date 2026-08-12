import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

export interface PushSyncPayload {
  invoices?: any[];
  payments?: any[];
  stockMovements?: any[];
  customers?: any[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private lastServerTimestamp = new Date().toISOString();

  constructor(
    private readonly dataSource: DataSource,
    private readonly salesService: SalesService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
  ) {}

  async pushPendingRecords(payload: PushSyncPayload) {
    this.logger.log(`Received bulk sync push from client: ${JSON.stringify(payload)}`);
    const syncedIds: { invoices: string[]; payments: string[]; stockMovements: string[] } = {
      invoices: [],
      payments: [],
      stockMovements: [],
    };

    // 1. Process local offline invoices pushed by client
    if (payload.invoices && payload.invoices.length > 0) {
      for (const invPayload of payload.invoices) {
        try {
          await this.salesService.create({
            id: invPayload.id,
            customerId: invPayload.customerId,
            attendant: invPayload.attendant,
            cashierId: invPayload.cashierId,
            discount: invPayload.discount,
            vat: invPayload.vat,
            amountPaid: invPayload.amountPaid,
            items: invPayload.items || [],
          });
          syncedIds.invoices.push(invPayload.id);
        } catch (err) {
          this.logger.warn(`Invoice ${invPayload.id} sync skipped or already exists.`);
          syncedIds.invoices.push(invPayload.id);
        }
      }
    }

    // 2. Process local offline payments
    if (payload.payments && payload.payments.length > 0) {
      for (const payPayload of payload.payments) {
        try {
          await this.salesService.recordPayment(payPayload.invoiceId, payPayload.amount, payPayload.method);
          syncedIds.payments.push(payPayload.id);
        } catch (err) {
          syncedIds.payments.push(payPayload.id);
        }
      }
    }

    // Update server timestamp
    this.lastServerTimestamp = new Date().toISOString();

    return {
      status: 'success',
      syncedIds,
      serverTime: this.lastServerTimestamp,
    };
  }

  async pullServerChanges(since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);

    const invoices = await this.salesService.findAll();
    const batches = await this.inventoryService.getBatches();
    const customers = await this.customersService.findAll();

    return {
      serverTime: new Date().toISOString(),
      delta: {
        invoices: invoices.filter((i) => new Date(i.createdAt) > sinceDate),
        batches: batches.filter((b) => new Date(b.createdAt) > sinceDate),
        customers: customers.filter((c) => new Date(c.createdAt) > sinceDate),
      },
    };
  }

  async resetAllDatabaseData() {
    this.logger.warn('Executing Master Factory Reset on PostgreSQL Database...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Truncate tables in dependency order with CASCADE
      await queryRunner.query(`
        TRUNCATE TABLE 
          invoice_items, 
          payments, 
          credit_terms, 
          invoices, 
          stock_movements, 
          batches, 
          products, 
          customers, 
          suppliers, 
          notifications, 
          audit_log 
        CASCADE;
      `);

      await queryRunner.commitTransaction();
      this.logger.log('PostgreSQL database master reset successfully executed.');
      return {
        status: 'success',
        message: 'Master factory reset executed. All records cleared from database.',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to reset PostgreSQL database', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
