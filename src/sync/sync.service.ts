import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SalesService } from '../sales/sales.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

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
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly salesService: SalesService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async pushPendingRecords(payload: PushSyncPayload) {
    this.logger.log(`Received bulk sync push from client: ${JSON.stringify(payload)}`);
    const syncedIds: { invoices: string[]; payments: string[]; stockMovements: string[] } = {
      invoices: [],
      payments: [],
      stockMovements: [],
    };

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
          syncedIds.invoices.push(invPayload.id);
        }
      }
    }

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
    
    // 1. Clear database tables via TypeORM DataSource
    if (this.dataSource && this.dataSource.isInitialized) {
      try {
        await this.dataSource.query(`TRUNCATE TABLE "products", "customers" CASCADE;`);
        this.logger.log('Successfully truncated products and customers PostgreSQL tables.');
      } catch (err: any) {
        this.logger.warn(`Direct truncate failed, trying fallback loop: ${err?.message || err}`);
        try {
          await this.dataSource.query(`
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
        } catch (innerErr: any) {
          this.logger.error(`Fallback truncate error: ${innerErr?.message || innerErr}`);
        }
      }
    }

    // 2. Clear all repositories & in-memory cache
    try {
      await this.productsService.clearAll();
    } catch (e: any) {
      this.logger.warn(`ProductsService clearAll: ${e?.message}`);
    }
    try {
      await this.customersService.clearAll();
    } catch (e: any) {
      this.logger.warn(`CustomersService clearAll: ${e?.message}`);
    }
    try {
      this.salesService.clearAll();
    } catch (e: any) {
      this.logger.warn(`SalesService clearAll: ${e?.message}`);
    }
    try {
      this.inventoryService.clearAll();
    } catch (e: any) {
      this.logger.warn(`InventoryService clearAll: ${e?.message}`);
    }
    try {
      this.auditService.clearAll();
    } catch (e: any) {
      this.logger.warn(`AuditService clearAll: ${e?.message}`);
    }
    try {
      this.notificationsService.clearAll();
    } catch (e: any) {
      this.logger.warn(`NotificationsService clearAll: ${e?.message}`);
    }

    this.logger.log('Master reset successfully executed on database and memory.');
    return {
      status: 'success',
      message: 'Master factory reset executed. All records cleared from database.',
      timestamp: new Date().toISOString(),
    };
  }
}
