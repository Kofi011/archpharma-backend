import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Batch {
  id: string;
  productId: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate: string; // ISO Date YYYY-MM-DD
  quantity: number;
  supplierId?: string;
  purchaseCost: number;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  batchId?: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'transfer';
  quantity: number;
  referenceType: 'purchase' | 'sale' | 'adjustment' | 'transfer';
  referenceId?: string;
  performedBy?: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
  createdAt: string;
}

export interface StockInDto {
  productId: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate: string;
  quantity: number;
  supplierId?: string;
  purchaseCost: number;
  performedBy?: string;
}

@Injectable()
export class InventoryService {
  private batches: Batch[] = [
    {
      id: 'b-9042',
      productId: 'p-1001',
      batchNumber: 'BT-9042',
      manufactureDate: '2024-09-01',
      expiryDate: '2026-09-01', // Expiring soon
      quantity: 45,
      purchaseCost: 180.00,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b-9043',
      productId: 'p-1002',
      batchNumber: 'BT-9043',
      manufactureDate: '2024-10-01',
      expiryDate: '2027-11-15',
      quantity: 120,
      purchaseCost: 30.00,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'b-9044',
      productId: 'p-1003',
      batchNumber: 'BT-9044',
      manufactureDate: '2025-01-10',
      expiryDate: '2028-04-20',
      quantity: 400,
      purchaseCost: 8.00,
      createdAt: new Date().toISOString(),
    },
  ];

  private movements: StockMovement[] = [
    {
      id: 'sm-1',
      productId: 'p-1001',
      batchId: 'b-9042',
      type: 'stock_in',
      quantity: 50,
      referenceType: 'purchase',
      syncStatus: 'synced',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'sm-2',
      productId: 'p-1001',
      batchId: 'b-9042',
      type: 'stock_out',
      quantity: 5,
      referenceType: 'sale',
      syncStatus: 'synced',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  async getBatches(productId?: string): Promise<Batch[]> {
    if (productId) {
      return this.batches
        .filter((b) => b.productId === productId)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()); // FIFO order (earliest expiry first)
    }
    return this.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  async getStockLedger(productId?: string): Promise<StockMovement[]> {
    if (productId) {
      return this.movements.filter((m) => m.productId === productId);
    }
    return this.movements;
  }

  async getCalculatedStock(productId: string): Promise<number> {
    const pMovements = this.movements.filter((m) => m.productId === productId);
    return pMovements.reduce((acc, m) => {
      if (m.type === 'stock_in') return acc + m.quantity;
      if (m.type === 'stock_out') return acc - m.quantity;
      if (m.type === 'adjustment') return acc + m.quantity;
      return acc;
    }, 0);
  }

  async stockIn(dto: StockInDto): Promise<{ batch: Batch; movement: StockMovement }> {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Stock in quantity must be greater than 0');
    }

    // Find existing batch or create new
    let batch = this.batches.find(
      (b) => b.productId === dto.productId && b.batchNumber.toLowerCase() === dto.batchNumber.toLowerCase(),
    );

    if (batch) {
      batch.quantity += dto.quantity;
    } else {
      batch = {
        id: uuidv4(),
        productId: dto.productId,
        batchNumber: dto.batchNumber,
        manufactureDate: dto.manufactureDate,
        expiryDate: dto.expiryDate,
        quantity: dto.quantity,
        supplierId: dto.supplierId,
        purchaseCost: dto.purchaseCost,
        createdAt: new Date().toISOString(),
      };
      this.batches.push(batch);
    }

    // Append to stock movements ledger (never mutate past rows)
    const movement: StockMovement = {
      id: uuidv4(),
      productId: dto.productId,
      batchId: batch.id,
      type: 'stock_in',
      quantity: dto.quantity,
      referenceType: 'purchase',
      performedBy: dto.performedBy,
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
    };
    this.movements.unshift(movement);

    return { batch, movement };
  }

  async getAlerts() {
    const now = new Date();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const nearExpiry = this.batches.filter((b) => {
      const exp = new Date(b.expiryDate).getTime();
      const diff = exp - now.getTime();
      return diff > 0 && diff <= ninetyDaysMs && b.quantity > 0;
    });

    const expired = this.batches.filter((b) => new Date(b.expiryDate).getTime() < now.getTime() && b.quantity > 0);

    return {
      nearExpiryBatches: nearExpiry,
      expiredBatches: expired,
      lowStockProducts: [
        { productId: 'p-1002', productName: 'Amoxicillin 500mg Capsules', currentStock: 8, reorderLevel: 25 },
      ],
    };
  }

  clearAll() {
    this.batches = [];
    this.movements = [];
  }
}

