import { Injectable } from '@angular/core';

// Contrato de item guardado en sessionStorage para este carrito legacy.
export interface CartItem {
  nombre: string;
  precio: string;
  imagen: string;
  cantidad: number;
  peso?: string;
}

@Injectable({ providedIn: 'root' })
// Almacen local de carrito (version legacy basada en sessionStorage).
export class CartStore {
  private items: CartItem[] = JSON.parse(sessionStorage.getItem('cart') ?? '[]');

  // Devuelve el snapshot actual de items.
  getItems(): CartItem[] {
    return this.items;
  }

  // Agrega o acumula cantidad si el producto ya existe.
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

  // Vacia completamente el carrito.
  clearCart(): void {
    this.items = [];
    this.save();
  }

  // Persiste el estado actual del carrito en sessionStorage.
  private save(): void {
    sessionStorage.setItem('cart', JSON.stringify(this.items));
  }
}