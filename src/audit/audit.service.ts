import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  action: 'stock_in' | 'stock_out' | 'invoice_create' | 'payment_received' | 'price_change' | 'login';
  tableName: string;
  recordId: string;
  details: string;
  createdAt: string;
}

@Injectable()
export class AuditService {
  private logs: AuditLogItem[] = [
    {
      id: 'al-1',
      userId: '22222222-2222-2222-2222-222222222222',
      userName: 'Daniel (Cashier)',
      action: 'invoice_create',
      tableName: 'invoices',
      recordId: 'inv-7001',
      details: 'Created invoice INV-2026-0709 for Liberty Pharmacy (GHS 235.00)',
      createdAt: '2026-07-09T10:30:00Z',
    },
    {
      id: 'al-2',
      userId: '33333333-3333-3333-3333-333333333333',
      userName: 'Francis Owusu (Storekeeper)',
      action: 'stock_in',
      tableName: 'stock_movements',
      recordId: 'sm-1',
      details: 'Recorded Stock-In: 50 units Tacrolin Ointment (Batch BT-9042)',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  async findAll() {
    return this.logs;
  }

  async logAction(action: AuditLogItem['action'], tableName: string, recordId: string, details: string, userId?: string, userName?: string) {
    const item: AuditLogItem = {
      id: uuidv4(),
      userId: userId || '11111111-1111-1111-1111-111111111111',
      userName: userName || 'Admin',
      action,
      tableName,
      recordId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.logs.unshift(item);
    return item;
  }

  clearAll() {
    this.logs = [];
  }
}
