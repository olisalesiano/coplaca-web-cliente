import { Injectable } from '@angular/core';
import { CartItem } from './api.models';

const CART_KEY = 'coplaca_cart';

@Injectable({ providedIn: 'root' })
export class CartStore {
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

  saveItems(items: CartItem[]): void {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

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

  clear(): void {
    localStorage.removeItem(CART_KEY);
  }
}
