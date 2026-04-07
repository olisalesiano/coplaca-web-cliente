import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { CartStore } from '../../../../core/cart.store';
import { CartItem } from '../../../../core/api.models';
import { OrderStore } from '../../../../core/order.store';
import {
  calculateCartSubtotal,
  calculateDeliveryFee,
  calculateTotal,
  roundMoney,
} from '../../../../core/pricing.utils';

type PaymentMethod = 'fisico' | 'paypal' | 'tarjeta';
type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
// Carrito del cliente: cantidades, validacion de pago y creacion de pedido.
export class CartComponent {
  readonly metodosPago = ['fisico', 'paypal', 'tarjeta'] as const;
  cartItems: CartItem[] = [];
  subtotalPedido = 0;
  gastosEnvio = 0;
  totalPedido = 0;
  feedback: { tone: FeedbackTone; text: string } | null = null;
  paymentDialogOpen = false;
  paymentError = '';
  selectedPaymentMethod: PaymentMethod = 'fisico';
  paypalEmail = '';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';
  creatingOrder = false;

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly cartStore: CartStore,
    private readonly orderStore: OrderStore,
  ) {
    this.refreshCart();
  }

  // Recalcula lineas y total del carrito desde almacenamiento local.
  refreshCart(): void {
    this.cartItems = this.cartStore.getItems();
    // Fuerza normalización de cada item siendo explícito sobre los types
    this.cartItems = this.cartItems.map((item) => {
      const unitPrice = Number(item.unitPrice || 0);
      const quantityKg = Number(item.quantityKg || 0);
      const stockQuantity = Number(item.stockQuantity || 0);
      return {
        ...item,
        unitPrice: Math.max(0, unitPrice),
        quantityKg: Math.max(0, quantityKg),
        stockQuantity: Math.max(0, stockQuantity),
      };
    });
    this.cartStore.saveItems(this.cartItems);
    this.subtotalPedido = calculateCartSubtotal(this.cartItems);
    this.gastosEnvio = calculateDeliveryFee(this.subtotalPedido);
    this.totalPedido = calculateTotal(this.subtotalPedido, this.gastosEnvio);
  }

  increment(item: CartItem): void {
    const nextQuantity = Number(Math.min(item.stockQuantity, item.quantityKg + 0.5).toFixed(2));
    if (nextQuantity === item.quantityKg) {
      this.setFeedback('warning', `Ya alcanzaste el stock maximo disponible para ${item.name}.`);
      return;
    }

    item.quantityKg = nextQuantity;
    this.cartStore.saveItems(this.cartItems);
    this.refreshCart();
  }

  decrement(item: CartItem): void {
    const nextQuantity = Number(Math.max(0.5, item.quantityKg - 0.5).toFixed(2));
    if (nextQuantity === item.quantityKg) {
      this.setFeedback('warning', `La cantidad minima para ${item.name} es 0.5 kg.`);
      return;
    }

    item.quantityKg = nextQuantity;
    this.cartStore.saveItems(this.cartItems);
    this.refreshCart();
  }

  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter((value) => value.productId !== item.productId);
    this.cartStore.saveItems(this.cartItems);
    this.refreshCart();
    this.setFeedback('info', 'Producto eliminado del carrito.');
  }

  clearCart(): void {
    if (this.cartItems.length === 0) {
      this.setFeedback('warning', 'Tu carrito ya esta vacio.');
      return;
    }

    this.cartStore.clear();
    this.refreshCart();
    this.setFeedback('success', 'Carrito vaciado correctamente.');
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
      this.setFeedback('warning', 'Tu carrito esta vacio. Agrega productos para continuar.');
      return;
    }

    this.openPaymentDialog();
  }

  openPaymentDialog(): void {
    this.paymentDialogOpen = true;
    this.paymentError = '';
    this.selectedPaymentMethod = 'fisico';
    this.paypalEmail = '';
    this.cardNumber = '';
    this.cardName = '';
    this.cardExpiry = '';
    this.cardCvv = '';
  }

  closePaymentDialog(): void {
    this.paymentDialogOpen = false;
    this.paymentError = '';
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.selectedPaymentMethod = method;
  }

  // Valida datos de pago segun metodo elegido y lanza la creacion de pedido.
  confirmarPago(): void {
    if (this.creatingOrder) {
      return;
    }

    if (this.selectedPaymentMethod === 'paypal' && !this.isValidEmail(this.paypalEmail)) {
      this.paymentError = 'Introduce un email valido para pagar con PayPal.';
      return;
    }

    if (this.selectedPaymentMethod === 'tarjeta') {
      const cardNumberDigits = this.cardNumber.split(' ').join('');
      if (!/^\d{16}$/.test(cardNumberDigits)) {
        this.paymentError = 'El numero de tarjeta debe tener 16 digitos.';
        return;
      }

      if (this.cardName.trim().length < 3) {
        this.paymentError = 'Introduce el nombre del titular de la tarjeta.';
        return;
      }

      if (!this.isValidExpiry(this.cardExpiry)) {
        this.paymentError = 'La fecha de caducidad de la tarjeta no es valida.';
        return;
      }

      if (!/^\d{3,4}$/.test(this.cardCvv)) {
        this.paymentError = 'El CVV debe tener 3 o 4 digitos.';
        return;
      }
    }

    this.paymentError = '';
    this.createOrder();
  }

  // Intenta crear pedido en API; si falla, registra pedido local de respaldo.
  private createOrder(): void {
    if (this.cartItems.length === 0) {
      this.setFeedback('warning', 'Tu carrito esta vacio.');
      return;
    }

    const items = this.cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantityKg,
      unitPrice: item.unitPrice,
      subtotal: this.getItemSubtotal(item),
    }));

    this.creatingOrder = true;
    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        const shippingAddressId = user.address?.id;
        this.apiService.createOrder(items, shippingAddressId, this.totalPedido).subscribe({
          next: (createdOrder) => {
            this.creatingOrder = false;
            this.orderStore.prependOrder(createdOrder);
            this.cartStore.clear();
            this.refreshCart();
            this.setFeedback(
              'success',
              this.selectedPaymentMethod === 'fisico'
                ? 'Pedido creado. Pagaras en fisico al recibirlo.'
                : 'Pedido creado y pago confirmado.',
            );
            this.closePaymentDialog();
            void this.router.navigate(['/client/orders']);
          },
          error: () => {
            this.creatingOrder = false;
            this.setFeedback(
              'error',
              'No se pudo crear el pedido en servidor. No se desconto stock ni se confirmo la compra.',
            );
          },
        });
      },
      error: () => {
        this.creatingOrder = false;
        this.setFeedback('error', 'No se pudo validar tu perfil para crear el pedido.');
      },
    });
  }

  trackItem(_index: number, item: CartItem): number {
    return item.productId;
  }

  getItemSubtotal(item: CartItem): number {
    return roundMoney(item.unitPrice * item.quantityKg);
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

  private setFeedback(tone: FeedbackTone, text: string): void {
    this.feedback = { tone, text };
  }
}
