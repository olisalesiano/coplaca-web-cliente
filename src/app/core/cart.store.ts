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
      const parsed = JSON.parse(raw) as CartItem[];
      // Normaliza para asegurar que los precios siempre son números
      return parsed.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice || 0),
        quantityKg: Number(item.quantityKg || 0),
        stockQuantity: Number(item.stockQuantity || 0),
      }));
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
    const unitPrice = Number(item.unitPrice || 0);
    const quantityKg = Number(item.quantityKg || 0);
    const stockQuantity = Number(item.stockQuantity || 0);
    const existing = current.find((value) => value.productId === item.productId);

    if (existing) {
      const mergedQuantity = Number((existing.quantityKg + quantityKg).toFixed(2));
      existing.stockQuantity = Math.max(0, stockQuantity);
      existing.unitPrice = unitPrice;
      existing.quantityKg = Number(Math.min(mergedQuantity, existing.stockQuantity || mergedQuantity).toFixed(2));
    } else {
      current.push({
        ...item,
        stockQuantity: Math.max(0, stockQuantity),
        unitPrice: unitPrice,
        quantityKg: Number(Math.min(quantityKg, stockQuantity || quantityKg).toFixed(2)),
      });
    }

    this.saveItems(current);
  }

  // Vacia el carrito local.
  clear(): void {
    localStorage.removeItem(CART_KEY);
  }
}
