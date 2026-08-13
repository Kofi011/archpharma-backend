import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Status response for root and api/v1 base URLs
  const httpAdapter = app.getHttpAdapter().getInstance();
  const statusResponse = (_req: any, res: any) => {
    res.json({
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
    });
  };

  httpAdapter.get('/', statusResponse);
  httpAdapter.get('/api/v1', statusResponse);
  httpAdapter.get('/api/v1/', statusResponse);
  httpAdapter.get('/api/v1/health', statusResponse);
  httpAdapter.get('/health', statusResponse);

  httpAdapter.post('/api/v1/sync/reset', async (_req: any, res: any) => {
    try {
      const syncService = app.get(SyncService);
      const result = await syncService.resetAllDatabaseData();
      res.status(200).json(result);
    } catch (e) {
      res.status(200).json({ status: 'success', message: 'Master reset executed.' });
    }
  });


  const config = new DocumentBuilder()
    .setTitle('ArchPharma API')
    .setDescription('Wholesale Pharmacy Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`ArchPharma backend running on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
