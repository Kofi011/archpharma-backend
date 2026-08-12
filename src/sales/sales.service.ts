import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  batchId?: string;
  qty: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  attendant?: string;
  invoiceDate: string;
  subtotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  printCount: number;
  items: InvoiceItem[];
  syncStatus: 'pending' | 'synced' | 'conflict';
  createdAt: string;
}

export interface CreateInvoiceDto {
  id?: string; // Optional client-generated UUID
  customerId?: string;
  attendant?: string;
  cashierId?: string;
  discount?: number;
  vat?: number;
  amountPaid?: number;
  items: {
    productId: string;
    qty: number;
    unitPrice: number;
    discount?: number;
  }[];
}

@Injectable()
export class SalesService {
  private invoices: Invoice[] = [
    {
      id: 'inv-7001',
      invoiceNumber: 'INV-2026-0709',
      customerId: 'c-2001',
      customerName: 'Liberty Pharmacy',
      cashierId: '22222222-2222-2222-2222-222222222222',
      cashierName: 'Daniel',
      attendant: 'Francis Owusu',
      invoiceDate: '2026-07-09T10:30:00Z',
      subtotal: 235.00,
      discount: 0.00,
      vat: 0.00,
      grandTotal: 235.00,
      amountPaid: 235.00,
      balance: 0.00,
      status: 'paid',
      printCount: 2,
      syncStatus: 'synced',
      createdAt: '2026-07-09T10:30:00Z',
      items: [
        {
          id: 'ii-1',
          invoiceId: 'inv-7001',
          productId: 'p-1001',
          batchId: 'b-9042',
          qty: 1,
          unitPrice: 235.00,
          discount: 0.00,
          lineTotal: 235.00,
        },
      ],
    },
  ];

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
  ) {}

  async findAll(query?: { customerId?: string; status?: string }): Promise<Invoice[]> {
    let list = [...this.invoices];
    if (query?.customerId) {
      list = list.filter((i) => i.customerId === query.customerId);
    }
    if (query?.status) {
      list = list.filter((i) => i.status === query.status);
    }
    return list;
  }

  async findOne(id: string): Promise<Invoice> {
    const inv = this.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!inv) throw new NotFoundException(`Invoice ${id} not found`);
    return inv;
  }

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Invoice must contain at least 1 item');
    }

    const invoiceId = dto.id || uuidv4();
    const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let customerName = 'Walk-in Customer';
    if (dto.customerId) {
      const cust = await this.customersService.findOne(dto.customerId);
      customerName = cust.businessName;
    }

    let subtotal = 0;
    const invoiceItems: InvoiceItem[] = [];

    // Server-side FIFO batch consumption verification
    for (const itemDto of dto.items) {
      const batches = await this.inventoryService.getBatches(itemDto.productId);
      const activeBatches = batches.filter((b) => b.quantity > 0);
      const chosenBatch = activeBatches.length > 0 ? activeBatches[0] : undefined; // FIFO: earliest expiry date

      const lineTotal = itemDto.qty * itemDto.unitPrice - (itemDto.discount || 0);
      subtotal += lineTotal;

      invoiceItems.push({
        id: uuidv4(),
        invoiceId,
        productId: itemDto.productId,
        batchId: chosenBatch?.id,
        qty: itemDto.qty,
        unitPrice: itemDto.unitPrice,
        discount: itemDto.discount || 0,
        lineTotal,
      });
    }

    const discount = dto.discount || 0;
    const vat = dto.vat || 0;
    const grandTotal = subtotal - discount + vat;
    const amountPaid = dto.amountPaid ?? grandTotal;
    const balance = grandTotal - amountPaid;
    let status: 'paid' | 'partial' | 'unpaid' | 'overdue' = 'paid';
    if (balance > 0 && amountPaid > 0) status = 'partial';
    if (balance > 0 && amountPaid === 0) status = 'unpaid';

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber: invoiceNum,
      customerId: dto.customerId,
      customerName,
      cashierId: dto.cashierId || '22222222-2222-2222-2222-222222222222',
      cashierName: 'Daniel',
      attendant: dto.attendant || 'Francis Owusu',
      invoiceDate: new Date().toISOString(),
      subtotal,
      discount,
      vat,
      grandTotal,
      amountPaid,
      balance,
      status,
      printCount: 1,
      items: invoiceItems,
      syncStatus: 'synced',
      createdAt: new Date().toISOString(),
    };

    this.invoices.unshift(newInvoice);
    return newInvoice;
  }

  async recordPayment(invoiceId: string, amount: number, method: string = 'cash') {
    const inv = await this.findOne(invoiceId);
    inv.amountPaid += amount;
    inv.balance = inv.grandTotal - inv.amountPaid;
    if (inv.balance <= 0) {
      inv.balance = 0;
      inv.status = 'paid';
    } else {
      inv.status = 'partial';
    }
    return inv;
  }
}
