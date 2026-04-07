import { CartItem, OrderDTO } from './api.models';
import { DELIVERY_FEE_EUR } from './pricing.constants';

export function roundMoney(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function calculateCartSubtotal(items: CartItem[]): number {
  const subtotal = items.reduce((acc, item) => acc + Number(item.unitPrice) * Number(item.quantityKg), 0);
  return roundMoney(subtotal);
}

export function calculateDeliveryFee(subtotal: number): number {
  return subtotal > 0 ? DELIVERY_FEE_EUR : 0;
}

export function calculateTotal(subtotal: number, deliveryFee: number): number {
  return roundMoney(subtotal + deliveryFee);
}

export function resolveOrderSubtotal(order: OrderDTO | null): number {
  if (!order) {
    return 0;
  }

  const explicitSubtotal = Number(order.subtotal);
  if (Number.isFinite(explicitSubtotal) && explicitSubtotal >= 0) {
    return roundMoney(explicitSubtotal);
  }

  const itemsSubtotal = order.items.reduce((acc, item) => {
    const lineSubtotal = Number.isFinite(Number(item.subtotal))
      ? Number(item.subtotal)
      : Number(item.quantity) * Number(item.unitPrice);
    return acc + (Number.isFinite(lineSubtotal) ? lineSubtotal : 0);
  }, 0);

  return roundMoney(itemsSubtotal);
}

export function resolveOrderDeliveryFee(order: OrderDTO | null): number {
  if (!order) {
    return 0;
  }

  return calculateDeliveryFee(resolveOrderSubtotal(order));
}