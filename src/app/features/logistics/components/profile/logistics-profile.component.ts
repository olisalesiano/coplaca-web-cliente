import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { LogisticsOrderDTO, UserDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-logistics-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logistics-profile.component.html',
  styleUrls: ['./logistics-profile.component.css'],
})
// Perfil logistico con indicadores del almacen asignado y estado de repartidores.
export class LogisticsProfileComponent implements OnInit {
  loading = false;
  error = '';
  user: UserDTO | null = null;
  warehouseLabel = 'Sin almacen';
  totalOrders = 0;
  confirmedOrders = 0;
  assignedOrders = 0;
  inTransitOrders = 0;
  deliveredOrders = 0;
  availableWorkers = 0;
  busyWorkers = 0;
  totalRevenue = 0;

  constructor(private readonly apiService: ApiService) {}

  // Carga perfil y metricas operativas del almacen.
  ngOnInit(): void {
    this.loadProfile();
  }

  get fullName(): string {
    if (!this.user) {
      return 'Usuario de logistica';
    }

    const name = `${this.user.firstName ?? ''} ${this.user.lastName ?? ''}`.trim();
    return name.length > 0 ? name : this.user.email;
  }

  private loadProfile(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        if (!user.warehouseId) {
          this.loading = false;
          this.error = 'Tu usuario no tiene almacen asignado. Contacta con administracion.';
          return;
        }

        this.warehouseLabel = user.warehouseName?.trim() || `Almacen ${user.warehouseId}`;
        this.loadWarehouseData(user.warehouseId);
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el perfil de logistica.';
      },
    });
  }

  private loadWarehouseData(warehouseId: number): void {
    forkJoin({
      orders: this.apiService.getLogisticsAllOrders(warehouseId).pipe(catchError(() => of([] as LogisticsOrderDTO[]))),
      workers: this.apiService.getAvailableDeliveryWorkers(warehouseId).pipe(catchError(() => of([]))),
      stats: this.apiService.getLogisticsWarehouseStats(warehouseId, 'month').pipe(catchError(() => of({}))),
    }).subscribe({
      next: ({ orders, workers, stats }) => {
        this.totalOrders = orders.length;
        this.confirmedOrders = this.countStatus(orders, 'CONFIRMED');
        this.assignedOrders = this.countStatus(orders, 'ASSIGNED') + this.countStatus(orders, 'ACCEPTED');
        this.inTransitOrders = this.countStatus(orders, 'IN_TRANSIT');
        this.deliveredOrders = this.countStatus(orders, 'DELIVERED');
        this.availableWorkers = workers.filter((worker) => worker.deliveryStatus === 'AT_WAREHOUSE').length;
        this.busyWorkers = workers.filter((worker) => worker.deliveryStatus === 'DELIVERING').length;
        this.totalRevenue = this.toNumber((stats as Record<string, unknown>)['revenue']);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar las metricas del almacen.';
      },
    });
  }

  private countStatus(orders: LogisticsOrderDTO[], status: string): number {
    return orders.filter((order) => (order.status ?? '').toUpperCase() === status).length;
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
