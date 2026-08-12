import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService, PushSyncPayload } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Push pending offline client records (invoices, payments, stock movements)' })
  async pushPendingRecords(@Body() payload: PushSyncPayload) {
    return this.syncService.pushPendingRecords(payload);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Pull server-side changes created/updated since timestamp' })
  async pullServerChanges(@Query('since') since?: string) {
    return this.syncService.pullServerChanges(since);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Master factory reset to delete all products, customers, suppliers, and invoices' })
  async resetAllDatabaseData() {
    return this.syncService.resetAllDatabaseData();
  }
}
