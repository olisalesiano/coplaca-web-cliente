import { Component, OnDestroy, OnInit } from '@angular/core';
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
// Operativa de pedidos logistica: carga, refresco automatico y asignacion a repartidores.
export class LogisticsOrdersComponent implements OnInit, OnDestroy {
  orders: LogisticsOrderDTO[] = [];
  workers: DeliveryWorkerDTO[] = [];
  selectedDeliveryByOrder: Record<number, number> = {};
  loading = false;
  assigningOrderId: number | null = null;
  warehouseId: number | null = null;
  private autoRefreshHandle: ReturnType<typeof setInterval> | null = null;
  error = '';
  warning = '';
  message = '';

  constructor(private readonly apiService: ApiService) {}

  // Inicializa almacen y activa refresco periodico.
  ngOnInit(): void {
    this.resolveWarehouseAndLoad();
  }

  // Libera intervalo de refresco al salir del componente.
  ngOnDestroy(): void {
    if (this.autoRefreshHandle) {
      clearInterval(this.autoRefreshHandle);
      this.autoRefreshHandle = null;
    }
  }

  // Resuelve el almacen del usuario autenticado antes de consultar pedidos.
  private resolveWarehouseAndLoad(): void {
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
        this.warehouseId = user.warehouseId;
        this.loadData();
        if (!this.autoRefreshHandle) {
          this.autoRefreshHandle = setInterval(() => {
            this.loadData(true);
          }, 15000);
        }
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(httpError, 'No se pudo resolver el almacen asociado al usuario.');
      },
    });
  }

  // Carga pedidos + repartidores para pintar estado operativo actual.
  loadData(silentRefresh = false): void {
    if (!this.warehouseId) {
      return;
    }

    this.loading = !silentRefresh;
    this.error = '';
    this.warning = '';
    if (!silentRefresh) {
      this.message = '';
    }

    forkJoin({
      orders: this.apiService.getLogisticsAllOrders(this.warehouseId),
      workers: this.apiService.getAvailableDeliveryWorkers(this.warehouseId),
    }).subscribe({
      next: ({ orders, workers }) => {
        this.orders = orders;
        this.workers = workers;

        if (orders.length === 0) {
          this.warning = 'No hay pedidos registrados en tu almacen.';
        } else if (this.assignableOrders.length > 0 && workers.length === 0) {
          this.warning = 'No hay repartidores disponibles. No podras asignar pedidos confirmados hasta que haya personal activo.';
        }

        this.loading = false;
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(httpError, 'No se pudo cargar la operativa de pedidos.');
      },
    });
  }

  // Asigna pedido confirmado a un repartidor seleccionado.
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
        this.loadData(true);
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

  canAssign(order: LogisticsOrderDTO): boolean {
    return this.normalizeStatus(order.status) === 'CONFIRMED';
  }

  statusLabel(status: string | undefined): string {
    const normalized = this.normalizeStatus(status);
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      ASSIGNED: 'Asignado',
      ACCEPTED: 'Aceptado por reparto',
      IN_TRANSIT: 'En reparto',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return labels[normalized] ?? 'Estado no definido';
  }

  statusClass(status: string | undefined): string {
    const normalized = this.normalizeStatus(status).toLowerCase().replace(/_/g, '-');
    return `status-badge ${normalized}`;
  }

  get pendingOrdersCount(): number {
    return this.assignableOrders.length;
  }

  get totalOrdersCount(): number {
    return this.orders.length;
  }

  get availableWorkersCount(): number {
    return this.workers.length;
  }

  get pendingOrdersAmount(): number {
    return this.assignableOrders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
  }

  get assignableOrders(): LogisticsOrderDTO[] {
    return this.orders.filter((order) => this.canAssign(order));
  }

  trackByOrderId(_: number, order: LogisticsOrderDTO): number {
    return order.id;
  }

  private normalizeStatus(status: string | undefined): string {
    return (status ?? '').trim().toUpperCase();
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
