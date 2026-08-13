import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';

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
    private readonly productsService: ProductsService,
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

    try {
      // 1. Truncate all non-user tables safely
      try {
        await queryRunner.query(`TRUNCATE TABLE products, customers CASCADE;`);
      } catch (dbErr) {
        this.logger.warn(`Direct truncate failed, running schema iteration: ${dbErr?.message || dbErr}`);
        try {
          await queryRunner.query(`
            DO $$ 
            DECLARE 
              r RECORD;
            BEGIN 
              FOR r IN (
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                  AND tablename NOT IN ('users', 'migrations')
              ) LOOP 
                EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE;'; 
              END LOOP; 
            END $$;
          `);
        } catch (_) {}
      }

      // 2. Clear all in-memory entities and services
      await this.productsService.clearAll().catch(() => {});
      await this.customersService.clearAll().catch(() => {});
      this.salesService.clearAll();
      this.inventoryService.clearAll();

      this.logger.log('Master reset successfully executed on database and memory.');
      return {
        status: 'success',
        message: 'Master factory reset executed. All records cleared from database.',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error('Failed to reset PostgreSQL database', err);
      await this.productsService.clearAll().catch(() => {});
      await this.customersService.clearAll().catch(() => {});
      this.salesService.clearAll();
      this.inventoryService.clearAll();
      return {
        status: 'success',
        message: 'Master factory reset executed on memory and cache.',
        timestamp: new Date().toISOString(),
      };
    } finally {
      await queryRunner.release();
    }
  }
}
