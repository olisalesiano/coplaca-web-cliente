import { Injectable } from '@angular/core';
import { AuthStore } from './auth.store';
import { OrderDTO } from './api.models';

const ORDERS_PREFIX = 'coplaca_orders_user_';
const LEGACY_ORDERS_KEY = 'coplaca_orders';

@Injectable({ providedIn: 'root' })
export class OrderStore {
  constructor(private readonly authStore: AuthStore) {}

  // Construye clave de almacenamiento por usuario para no mezclar historiales.
  private getOrdersKey(): string {
    return `${ORDERS_PREFIX}${this.authStore.getUserScope()}`;
  }

  // Carga pedidos cacheados localmente para el usuario actual.
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

  // Persiste lista completa de pedidos locales del usuario actual.
  saveOrders(orders: OrderDTO[]): void {
    localStorage.setItem(this.getOrdersKey(), JSON.stringify(orders));
  }

  // Inserta pedido reciente al inicio y elimina duplicados por id/orderNumber.
  prependOrder(order: OrderDTO): void {
    const existing = this.getOrders();
    const deduped = existing.filter(
      (value) => value.id !== order.id && value.orderNumber !== order.orderNumber,
    );
    this.saveOrders([order, ...deduped]);
  }

  // Mezcla pedidos de API con pedidos locales/offline aun no reflejados en servidor.
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

  // Limpia clave actual y clave legacy.
  clear(): void {
    localStorage.removeItem(this.getOrdersKey());
    localStorage.removeItem(LEGACY_ORDERS_KEY);
  }
}