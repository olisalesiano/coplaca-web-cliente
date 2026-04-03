import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/api.service';
import { AddressDTO, OrderDTO } from '../../../../core/api.models';
import { OrderStore } from '../../../../core/order.store';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
// Historial de pedidos del cliente: merge remoto/local y detalle por pedido.
export class OrdersComponent implements OnInit, OnDestroy {
  pedidos: OrderDTO[] = [];
  pedidoSeleccionado: OrderDTO | null = null;
  dialogVisible = false;
  error = '';
  deliveryNotice = '';
  loading = false;
  viewMode: 'active' | 'history' = 'active';
  private autoRefreshHandle: ReturnType<typeof setInterval> | null = null;
  private readonly productImageMap: Record<number, string> = {};

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly orderStore: OrderStore,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.pedidos = this.orderStore.getOrders();
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadProductImages();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshHandle) {
      clearInterval(this.autoRefreshHandle);
      this.autoRefreshHandle = null;
    }
  }

  // Precarga imagenes para enriquecer la vista de detalle de cada pedido.
  private loadProductImages(): void {
    this.apiService.getProducts().subscribe({
      next: (products) => {
        for (const product of products) {
          if (product.imageUrl) {
            this.productImageMap[product.id] = product.imageUrl;
          }
        }
      },
      error: () => {
        // Keep fallback image when products catalog is not available.
      },
    });
  }

  // Sincroniza pedidos remotos con respaldo local para escenarios offline.
  loadOrders(): void {
    this.loading = true;
    this.error = '';
    const previousStatus = this.getStatusMap(this.pedidos);

    this.apiService.getMyOrders().subscribe({
      next: (orders) => {
        const mergedOrders = this.orderStore.mergeWithStored(orders);
        this.pedidos = mergedOrders;
        this.orderStore.saveOrders(mergedOrders);
        this.notifyDeliveredOrders(previousStatus, mergedOrders);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        if (this.pedidos.length === 0) {
          this.error = 'No se pudieron cargar los pedidos.';
          return;
        }

        this.error = 'Mostrando pedidos guardados localmente (sin conexion).';
      },
    });
  }

  showHistory(): void {
    this.viewMode = 'history';
  }

  showActiveOrders(): void {
    this.viewMode = 'active';
  }

  get displayedOrders(): OrderDTO[] {
    return this.viewMode === 'history' ? this.deliveredOrders : this.activeOrders;
  }

  get activeOrders(): OrderDTO[] {
    return this.pedidos.filter((order) => {
      const status = this.normalizeStatus(order.status);
      return status !== 'DELIVERED' && status !== 'CANCELLED';
    });
  }

  get deliveredOrders(): OrderDTO[] {
    return this.pedidos.filter((order) => {
      const status = this.normalizeStatus(order.status);
      return status === 'DELIVERED';
    });
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

  verDetalles(pedido: OrderDTO): void {
    this.pedidoSeleccionado = pedido;
    this.dialogVisible = true;
  }

  getDeliveryAddress(pedido: OrderDTO | null): string {
    if (!pedido) {
      return 'Dirección no disponible';
    }

    if (pedido.deliveryAddressLabel && pedido.deliveryAddressLabel.trim().length > 0) {
      return pedido.deliveryAddressLabel;
    }

    if (pedido.deliveryAddress) {
      return this.formatAddress(pedido.deliveryAddress);
    }

    return 'Dirección no disponible';
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.pedidoSeleccionado = null;
  }

  cancelarPedido(): void {
    this.cerrarDialog();
  }

  trackOrder(_index: number, pedido: OrderDTO): number {
    return pedido.id;
  }

  resolveProductImage(productId: number): string {
    return this.productImageMap[productId] || '/assets/test/Banana.png';
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshHandle) {
      clearInterval(this.autoRefreshHandle);
    }

    this.autoRefreshHandle = setInterval(() => this.loadOrders(), 15000);
  }

  private getStatusMap(orders: OrderDTO[]): Map<string, string> {
    const statusMap = new Map<string, string>();
    for (const order of orders) {
      statusMap.set(this.getOrderIdentity(order), this.normalizeStatus(order.status));
    }
    return statusMap;
  }

  private notifyDeliveredOrders(previousStatus: Map<string, string>, currentOrders: OrderDTO[]): void {
    const deliveredOrders = currentOrders.filter((order) => {
      const orderId = this.getOrderIdentity(order);
      const previous = previousStatus.get(orderId);
      const current = this.normalizeStatus(order.status);
      return Boolean(previous) && previous !== 'DELIVERED' && current === 'DELIVERED';
    });

    if (deliveredOrders.length === 0) {
      return;
    }

    const lastDelivered = deliveredOrders.at(-1);
    if (!lastDelivered) {
      return;
    }

    const orderLabel = `#${lastDelivered.orderNumber || lastDelivered.id}`;
    this.deliveryNotice = `Tu pedido ${orderLabel} ya fue entregado.`;
    this.sendBrowserNotification(this.deliveryNotice);
  }

  private sendBrowserNotification(message: string): void {
    if (globalThis.window === undefined || !('Notification' in globalThis.window)) {
      return;
    }

    const notificationApi = globalThis.window.Notification;
    if (notificationApi.permission === 'granted') {
      const deliveryNotification = new notificationApi('COPLACA - Entrega completada', { body: message });
      deliveryNotification.onshow = () => {
        deliveryNotification.close();
      };
      return;
    }

    if (notificationApi.permission === 'default') {
      notificationApi.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const deliveryNotification = new notificationApi('COPLACA - Entrega completada', { body: message });
          deliveryNotification.onshow = () => {
            deliveryNotification.close();
          };
        }
      });
    }
  }

  private getOrderIdentity(order: OrderDTO): string {
    return order.orderNumber || String(order.id);
  }

  private normalizeStatus(status: string | undefined): string {
    return (status || '').trim().toUpperCase();
  }

  private formatAddress(address: AddressDTO): string {
    const parts: string[] = [];

    const streetLine = [address.street, address.streetNumber, address.apartment]
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .map((value) => value.trim())
      .join(' ');

    if (streetLine.length > 0) {
      parts.push(streetLine);
    }

    if (address.postalCode && address.postalCode.trim().length > 0) {
      parts.push(address.postalCode.trim());
    }

    if (address.city && address.city.trim().length > 0) {
      parts.push(address.city.trim());
    }

    if (address.province && address.province.trim().length > 0) {
      parts.push(address.province.trim());
    }

    if (address.additionalInfo && address.additionalInfo.trim().length > 0) {
      parts.push(address.additionalInfo.trim());
    }

    return parts.join(', ');
  }
}
