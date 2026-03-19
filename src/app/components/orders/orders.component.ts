import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { OrderDTO } from '../../core/api.models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent {
  pedidos: OrderDTO[] = [];
  pedidoSeleccionado: OrderDTO | null = null;
  dialogVisible = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
  ) {
    this.loadOrders();
  }

  loadOrders(): void {
    this.apiService.getMyOrders().subscribe({
      next: (orders) => {
        this.pedidos = orders;
      },
      error: () => {
        this.error = 'No se pudieron cargar los pedidos.';
      },
    });
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
}
