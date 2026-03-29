import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/api.service';
import { OrderDTO } from '../../../../core/api.models';
import { OrderStore } from '../../../../core/order.store';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
// Historial de pedidos del cliente: merge remoto/local y detalle por pedido.
export class OrdersComponent {
  pedidos: OrderDTO[] = [];
  pedidoSeleccionado: OrderDTO | null = null;
  dialogVisible = false;
  error = '';
  loading = false;
  private readonly productImageMap: Record<number, string> = {};

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly orderStore: OrderStore,
  ) {
    this.pedidos = this.orderStore.getOrders();
    this.loadOrders();
    this.loadProductImages();
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

    this.apiService.getMyOrders().subscribe({
      next: (orders) => {
        const mergedOrders = this.orderStore.mergeWithStored(orders);
        this.pedidos = mergedOrders;
        this.orderStore.saveOrders(mergedOrders);
        this.loading = false;
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
}
