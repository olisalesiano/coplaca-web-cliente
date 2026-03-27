import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { DeliveryWorkerDTO, LogisticsOrderDTO, UserDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-logistics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logistics-dashboard.component.html',
  styleUrls: ['./logistics-dashboard.component.css'],
})
export class LogisticsDashboardComponent implements OnInit {
  loading = false;
  error = '';

  user: UserDTO | null = null;
  pendingOrders: LogisticsOrderDTO[] = [];
  confirmedOrders: LogisticsOrderDTO[] = [];
  inTransitOrders: LogisticsOrderDTO[] = [];
  activeDeliveryUsers: DeliveryWorkerDTO[] = [];
  activeLogisticsUsersCount = 0;
  totalProducts = 0;
  activeOffers = 0;
  totalOrdersMonth = 0;
  completedOrdersMonth = 0;
  revenueMonth = 0;
  pendingRevenue = 0;

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get warehouseLabel(): string {
    return this.user?.warehouseName || 'No asignado';
  }

  private loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;

        if (!user.warehouseId) {
          this.loading = false;
          this.error = 'Tu cuenta de logistica no tiene almacen asignado.';
          return;
        }

        forkJoin({
          pendingOrders: this.apiService.getLogisticsOrders(user.warehouseId).pipe(catchError(() => of([]))),
          confirmedOrders: this.apiService.getLogisticsConfirmedOrders(user.warehouseId).pipe(catchError(() => of([]))),
          inTransitOrders: this.apiService.getLogisticsInTransitOrders(user.warehouseId).pipe(catchError(() => of([]))),
          deliveryWorkers: this.apiService
            .getAvailableDeliveryWorkers(user.warehouseId)
            .pipe(catchError(() => of([]))),
          warehouseStats: this.apiService
            .getLogisticsWarehouseStats(user.warehouseId, 'month')
            .pipe(catchError(() => of({} as Record<string, number>))),
          products: this.apiService.getProducts().pipe(catchError(() => of([]))),
          offers: this.apiService.getOffers().pipe(catchError(() => of([]))),
        }).subscribe({
          next: ({ pendingOrders, confirmedOrders, inTransitOrders, deliveryWorkers, warehouseStats, products, offers }) => {
            this.pendingOrders = pendingOrders;
            this.confirmedOrders = confirmedOrders;
            this.inTransitOrders = inTransitOrders;
            this.activeDeliveryUsers = deliveryWorkers.filter((entry) => entry.enabled !== false);
            this.activeLogisticsUsersCount =
              this.normalizeNumber(warehouseStats['activeLogisticsUsers']) || (this.user?.enabled ? 1 : 0);
            this.totalProducts = products.length;
            this.activeOffers = offers.filter((offer) => offer.active !== false).length;

            const fallbackPendingRevenue = pendingOrders.reduce(
              (sum, order) => sum + this.normalizeNumber(order.totalPrice),
              0,
            );
            this.totalOrdersMonth = this.normalizeNumber(warehouseStats['totalOrders']);
            this.completedOrdersMonth = this.normalizeNumber(warehouseStats['completedOrders']);
            this.revenueMonth = this.normalizeNumber(warehouseStats['revenue']);
            this.pendingRevenue =
              this.normalizeNumber(warehouseStats['pendingRevenue']) || fallbackPendingRevenue;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.error = 'No se pudieron cargar las estadisticas operativas de logistica.';
          },
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo obtener la informacion del usuario.';
      },
    });
  }

  private normalizeNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }
}
