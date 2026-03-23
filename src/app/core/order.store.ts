import { Injectable } from '@angular/core';
import { OrderDTO } from './api.models';

const ORDERS_KEY = 'coplaca_orders';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  getOrders(): OrderDTO[] {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as OrderDTO[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveOrders(orders: OrderDTO[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  prependOrder(order: OrderDTO): void {
    const existing = this.getOrders();
    const deduped = existing.filter((value) => value.id !== order.id);
    this.saveOrders([order, ...deduped]);
  }

  clear(): void {
    localStorage.removeItem(ORDERS_KEY);
  }
}