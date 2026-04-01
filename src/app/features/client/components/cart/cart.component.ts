import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// import { MatIconModule, MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { CartStore } from '../../../../core/cart.store';
import { CartItem, OrderDTO } from '../../../../core/api.models';
import { OrderStore } from '../../../../core/order.store';

type PaymentMethod = 'fisico' | 'paypal' | 'tarjeta';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  readonly metodosPago = ['fisico', 'paypal', 'tarjeta'] as const;
  cartItems: CartItem[] = [];
  totalPedido = 0;
  message = '';
  paymentDialogOpen = false;
  selectedPaymentMethod: PaymentMethod = 'fisico';
  paypalEmail = '';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';

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
    this.totalPedido = this.cartItems.reduce((acc, item) => acc + this.getItemSubtotal(item), 0);
    this.totalPedido = this.roundMoney(this.totalPedido);
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

  goToOurProducts(): void {
    this.router.navigate(['/client/our-products']);
  }
  goToOrders(): void {
    this.router.navigate(['/client/orders']);
  }
  goToCart(): void {
    this.router.navigate(['/client/cart']);
  }
  goToProfile(): void {
    this.router.navigate(['/client/profile']);
  }
  pagar(): void {
    if (this.cartItems.length === 0) {
      this.message = 'Tu carrito esta vacio.';
      return;
    }

    this.openPaymentDialog();
  }

  openPaymentDialog(): void {
    this.paymentDialogOpen = true;
    this.selectedPaymentMethod = 'fisico';
    this.paypalEmail = '';
    this.cardNumber = '';
    this.cardName = '';
    this.cardExpiry = '';
    this.cardCvv = '';
  }

  closePaymentDialog(): void {
    this.paymentDialogOpen = false;
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
  }

  confirmarPago(): void {
    if (this.selectedPaymentMethod === 'paypal' && !this.isValidEmail(this.paypalEmail)) {
      this.message = 'Introduce un email valido para pagar con PayPal.';
      return;
    }

    if (this.selectedPaymentMethod === 'tarjeta') {
      const cardNumberDigits = this.cardNumber.split(' ').join('');
      if (!/^\d{16}$/.test(cardNumberDigits)) {
        this.message = 'El numero de tarjeta debe tener 16 digitos.';
        return;
      }

      if (this.cardName.trim().length < 3) {
        this.message = 'Introduce el nombre del titular de la tarjeta.';
        return;
      }

      if (!this.isValidExpiry(this.cardExpiry)) {
        this.message = 'La fecha de caducidad de la tarjeta no es valida.';
        return;
      }

      if (!/^\d{3,4}$/.test(this.cardCvv)) {
        this.message = 'El CVV debe tener 3 o 4 digitos.';
        return;
      }
    }

    this.createOrder();
  }

  private createOrder(): void {
    const items = this.cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantityKg,
    }));

    this.apiService.createOrder(items).subscribe({
      next: (createdOrder) => {
        this.orderStore.prependOrder(createdOrder);
        this.cartStore.clear();
        this.refreshCart();
        this.message =
          this.selectedPaymentMethod === 'fisico'
            ? 'Pedido creado. Pagaras en fisico al recibirlo.'
            : 'Pedido creado y pago confirmado.';
        this.closePaymentDialog();
        void this.router.navigate(['/orders']);
      },
      error: () => {
        const localOrder = this.buildLocalOrderFromCart();
        this.orderStore.prependOrder(localOrder);
        this.cartStore.clear();
        this.refreshCart();
        this.message = 'Pedido guardado localmente. Se sincronizara cuando haya conexion.';
        this.closePaymentDialog();
        void this.router.navigate(['/orders']);
      },
    });
  }

  private buildLocalOrderFromCart(): OrderDTO {
    const now = new Date();
    const timestamp = now.getTime();
    const paymentMethodMap: Record<PaymentMethod, string> = {
      fisico: 'PHYSICAL',
      paypal: 'PAYPAL',
      tarjeta: 'CARD',
    };

    return {
      id: -timestamp,
      orderNumber: `LOCAL-${timestamp}`,
      status: 'PENDING',
      totalPrice: this.totalPedido,
      paymentMethod: paymentMethodMap[this.selectedPaymentMethod],
      paymentStatus: 'PENDING',
      createdAt: now.toISOString(),
      items: this.cartItems.map((item, index) => ({
        id: index + 1,
        productId: item.productId,
        productName: item.name,
        quantity: item.quantityKg,
        unitPrice: item.unitPrice,
        subtotal: this.getItemSubtotal(item),
      })),
    };
  }

  trackItem(_index: number, item: CartItem): number {
    return item.productId;
  }

  getItemSubtotal(item: CartItem): number {
    return this.roundMoney(item.unitPrice * item.quantityKg);
  }

  private roundMoney(value: number): number {
    return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isValidExpiry(value: string): boolean {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value.trim());
    if (!match) {
      return false;
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    const expiry = new Date(year, month);
    return expiry > new Date(now.getFullYear(), now.getMonth());
  }
}
