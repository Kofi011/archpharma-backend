import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomersModule } from './customers/customers.module';
import { SalesModule } from './sales/sales.module';
import { SyncModule } from './sync/sync.module';
import { CreditModule } from './credit/credit.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL;

        // 1. Cloud deployment (Railway / Render / Heroku / Supabase) via DATABASE_URL
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true, // Auto-creates schema tables on first deploy
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        // 2. Individual environment variables (Local PostgreSQL or Railway PG vars)
        const isSsl = process.env.DB_SSL === 'true' || !!process.env.RAILWAY_ENVIRONMENT;

        return {
          type: 'postgres',
          host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
          port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
          username: process.env.DB_USERNAME || process.env.PGUSER || 'postgres',
          password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
          database: process.env.DB_DATABASE || process.env.PGDATABASE || 'archpharma',
          autoLoadEntities: true,
          synchronize: true,
          ssl: isSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    ProductsModule,
    InventoryModule,
    CustomersModule,
    SalesModule,
    SyncModule,
    CreditModule,
    ReportsModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
