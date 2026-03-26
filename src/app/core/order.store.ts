import { Injectable } from '@angular/core';
import { AuthStore } from './auth.store';
import { OrderDTO } from './api.models';

const ORDERS_PREFIX = 'coplaca_orders_user_';
const LEGACY_ORDERS_KEY = 'coplaca_orders';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  constructor(private readonly authStore: AuthStore) {}

  private getOrdersKey(): string {
    return `${ORDERS_PREFIX}${this.authStore.getUserScope()}`;
  }

  getOrders(): OrderDTO[] {
    const raw = localStorage.getItem(this.getOrdersKey());
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
    localStorage.setItem(this.getOrdersKey(), JSON.stringify(orders));
  }

  prependOrder(order: OrderDTO): void {
    const existing = this.getOrders();
    const deduped = existing.filter(
      (value) => value.id !== order.id && value.orderNumber !== order.orderNumber,
    );
    this.saveOrders([order, ...deduped]);
  }

  mergeWithStored(ordersFromApi: OrderDTO[]): OrderDTO[] {
    const local = this.getOrders();
    const merged = [...ordersFromApi];

    for (const localOrder of local) {
      const alreadyPresent = merged.some(
        (remoteOrder) =>
          remoteOrder.id === localOrder.id ||
          (Boolean(remoteOrder.orderNumber) && remoteOrder.orderNumber === localOrder.orderNumber),
      );

      if (!alreadyPresent) {
        merged.push(localOrder);
      }
    }

    return merged;
  }

  clear(): void {
    localStorage.removeItem(this.getOrdersKey());
    localStorage.removeItem(LEGACY_ORDERS_KEY);
  }
}