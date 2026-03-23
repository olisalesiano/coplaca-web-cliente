import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule, MatIcon } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../core/cart.store';
import { CartItem } from '../../core/api.models';
import { OrderStore } from '../../core/order.store';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatIcon, MatIconModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  cartItems: CartItem[] = [];
  totalPedido = 0;
  message = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly cartStore: CartStore,
    private readonly orderStore: OrderStore,
  ) {
    this.refreshCart();
  }

  refreshCart(): void {
    this.cartItems = this.cartStore.getItems();
    this.totalPedido = this.cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantityKg, 0);
  }

  increment(item: CartItem): void {
    item.quantityKg = Number(Math.min(item.stockQuantity, item.quantityKg + 0.5).toFixed(2));
    this.cartStore.saveItems(this.cartItems);
    this.refreshCart();
  }

  decrement(item: CartItem): void {
    item.quantityKg = Number(Math.max(0.5, item.quantityKg - 0.5).toFixed(2));
    this.cartStore.saveItems(this.cartItems);
    this.refreshCart();
  }

  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter((value) => value.productId !== item.productId);
    this.cartStore.saveItems(this.cartItems);
    this.refreshCart();
    this.message = 'Producto eliminado del carrito.';
  }

  clearCart(): void {
    this.cartStore.clear();
    this.refreshCart();
    this.message = 'Carrito vaciado correctamente.';
  }

  goToShop(): void {
    this.router.navigate(['/our-products']);
  }
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }
  goToCart(): void {
    this.router.navigate(['/cart']);
  }
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
  pagar(): void {
    if (this.cartItems.length === 0) {
      this.message = 'Tu carrito esta vacio.';
      return;
    }

    const items = this.cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantityKg,
    }));

    this.apiService.createOrder(items).subscribe({
      next: (createdOrder) => {
        this.orderStore.prependOrder(createdOrder);
        this.cartStore.clear();
        this.refreshCart();
        this.message = 'Pedido creado correctamente.';
        void this.router.navigate(['/orders']);
      },
      error: () => {
        this.message = 'No se pudo crear el pedido.';
      },
    });
  }

  trackItem(_index: number, item: CartItem): number {
    return item.productId;
  }
}
