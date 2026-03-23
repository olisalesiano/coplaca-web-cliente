import { Injectable } from '@angular/core';

export interface CartItem {
  nombre: string;
  precio: string;
  imagen: string;
  cantidad: number;
  peso?: string;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private items: CartItem[] = JSON.parse(sessionStorage.getItem('cart') ?? '[]');

  getItems(): CartItem[] {
    return this.items;
  }

  addItem(product: any, cantidad: number): void {
    const existing = this.items.find(i => i.nombre === product.nombre);
    if (existing) {
      existing.cantidad += cantidad;
    } else {
      this.items.push({
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen,
        cantidad,
        peso: product.peso,
      });
    }
    this.save();
  }

  clearCart(): void {
    this.items = [];
    this.save();
  }

  private save(): void {
    sessionStorage.setItem('cart', JSON.stringify(this.items));
  }
}