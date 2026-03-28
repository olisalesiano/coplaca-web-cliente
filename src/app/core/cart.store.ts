import { Injectable } from '@angular/core';
import { CartItem } from './api.models';

const CART_KEY = 'coplaca_cart';

@Injectable({ providedIn: 'root' })
export class CartStore {
  // Lee carrito persistido o devuelve lista vacia en primer uso/JSON invalido.
  getItems(): CartItem[] {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }

  // Guarda snapshot completo del carrito en localStorage.
  saveItems(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  // Agrega producto nuevo o acumula cantidad si ya existe en carrito.
  addItem(item: CartItem): void {
    const current = this.getItems();
    const existing = current.find((value) => value.productId === item.productId);

    if (existing) {
      existing.quantityKg = Number((existing.quantityKg + item.quantityKg).toFixed(2));
    } else {
      current.push(item);
    }

    this.saveItems(current);
  }

  // Vacia el carrito local.
  clear(): void {
    localStorage.removeItem(CART_KEY);
  }
}
