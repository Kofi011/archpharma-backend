import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'low_stock' | 'expiry' | 'credit_limit' | 'system';
  isRead: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  private notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'Low Stock Warning',
      message: 'Amoxicillin 500mg Capsules has fallen to 8 units (Reorder Level: 25).',
      type: 'low_stock',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'notif-2',
      title: 'Near Expiry Alert',
      message: 'Batch #BT-9042 (Tacrolin 0.1% Ointment) expires on 2026-09-01 (45 units).',
      type: 'expiry',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'notif-3',
      title: 'Credit Limit Warning',
      message: 'Mawumenyo Pharmacy has reached 48% of credit limit (GHS 4,800 / GHS 10,000).',
      type: 'credit_limit',
      isRead: true,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  async findAll() {
    return this.notifications;
  }

  async markAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    notif.isRead = true;
    return notif;
  }

  async create(dto: { title: string; message: string; type: NotificationItem['type'] }) {
    const newNotif: NotificationItem = {
      id: uuidv4(),
      title: dto.title,
      message: dto.message,
      type: dto.type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  clearAll() {
    this.notifications = [];
  }
}
