import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { DeliveryWorkerDTO, LogisticsOrderDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-logistics-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logistics-orders.component.html',
  styleUrls: ['./logistics-orders.component.css'],
})
export class LogisticsOrdersComponent implements OnInit {
  orders: LogisticsOrderDTO[] = [];
  workers: DeliveryWorkerDTO[] = [];
  selectedDeliveryByOrder: Record<number, number> = {};
  loading = false;
  assigningOrderId: number | null = null;
  error = '';
  warning = '';
  message = '';

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.warning = '';
    this.message = '';

    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        if (!user.warehouseId) {
          this.loading = false;
          this.error = 'No tienes almacen asignado para operar en logistica.';
          return;
        }

        forkJoin({
          orders: this.apiService.getLogisticsOrders(user.warehouseId),
          workers: this.apiService.getAvailableDeliveryWorkers(user.warehouseId),
        }).subscribe({
          next: ({ orders, workers }) => {
            this.orders = orders;
            this.workers = workers;

            if (orders.length === 0) {
              this.warning = 'No hay pedidos pendientes en tu almacen.';
            } else if (workers.length === 0) {
              this.warning = 'No hay repartidores disponibles. No podras asignar pedidos hasta que haya personal activo.';
            }

            this.loading = false;
          },
          error: (httpError: unknown) => {
            this.loading = false;
            this.error = this.extractErrorMessage(httpError, 'No se pudo cargar la operativa de pedidos.');
          },
        });
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(httpError, 'No se pudo resolver el almacen asociado al usuario.');
      },
    });
  }

  assignOrder(orderId: number): void {
    if (this.assigningOrderId !== null) {
      this.warning = 'Ya hay una asignacion en curso. Espera a que termine.';
      return;
    }

    const deliveryUserId = this.selectedDeliveryByOrder[orderId];
    if (!deliveryUserId) {
      this.error = 'Selecciona un repartidor disponible.';
      return;
    }

    const worker = this.workers.find((item) => item.id === deliveryUserId);
    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'el repartidor seleccionado';
    const confirmed = confirm(`Vas a asignar el pedido ${orderId} a ${workerName}. ¿Confirmas la operacion?`);
    if (!confirmed) {
      this.warning = 'Asignacion cancelada por seguridad.';
      return;
    }

    this.assigningOrderId = orderId;
    this.error = '';
    this.warning = '';
    this.message = '';
    this.apiService.assignOrderToDelivery(orderId, deliveryUserId).subscribe({
      next: () => {
        this.assigningOrderId = null;
        this.message = `Pedido ${orderId} asignado correctamente.`;
        this.orders = this.orders.filter((order) => order.id !== orderId);
      },
      error: (httpError: unknown) => {
        this.assigningOrderId = null;
        this.error = this.extractErrorMessage(httpError, 'No se pudo asignar el pedido.');
      },
    });
  }

  isAssigning(orderId: number): boolean {
    return this.assigningOrderId === orderId;
  }

  trackByOrderId(_: number, order: LogisticsOrderDTO): number {
    return order.id;
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 401) {
      return 'Sesion caducada. Inicia sesion de nuevo.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para operar pedidos de este almacen.';
    }
    if (error.status === 409) {
      return 'El pedido ya fue asignado o cambio de estado. Recarga los datos e intenta otra vez.';
    }

    const payload = error.error as { message?: string; error?: string } | string | null;
    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload.trim();
    }
    if (payload && typeof payload === 'object') {
      const backendMessage = payload.message?.trim() || payload.error?.trim();
      if (backendMessage) {
        return backendMessage;
      }
    }

    return fallback;
  }
}
