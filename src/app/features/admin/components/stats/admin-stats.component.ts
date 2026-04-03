import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ApiService } from '../../../../core/api.service';
import { TopProductStatDTO } from '../../../../core/api.models';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './admin-stats.component.html',
  styleUrls: ['./admin-stats.component.css'],
})
// Panel de metricas administrativas: top de productos y salud de base de datos.
export class AdminStatsComponent implements OnInit {
  topProducts: TopProductStatDTO[] = [];
  loading = false;
  error = '';
  databaseStatus = '';
  databaseMessage = '';
  usersInDatabase = 0;
  activeUsers = 0;
  disabledUsers = 0;
  logisticsUsers = 0;
  deliveryUsers = 0;
  totalOrdersMonth = 0;
  totalOrdersWeek = 0;
  totalOrdersDay = 0;
  completedOrdersMonth = 0;
  averageOrderValueMonth = 0;
  revenueMonth = 0;
  totalProducts = 0;
  activeOffers = 0;
  activeWarehouses = 0;

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // Al iniciar, carga estadisticas de negocio y estado tecnico del backend.
  ngOnInit(): void {
    this.loadStats();
    this.checkDatabaseHealth();
  }

  // Obtiene ranking de productos vendidos del ultimo periodo.
  loadStats(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      topProducts: this.apiService.getTopSellingProductsLastMonth().pipe(catchError(() => of([]))),
      users: this.apiService.getAdminUsers().pipe(catchError(() => of([]))),
      orderMonth: this.apiService.getAdminOrderStats('month').pipe(
        catchError(() =>
          of({
            totalOrders: 0,
            completedOrders: 0,
            averageOrderValue: 0,
            revenue: 0,
          }),
        ),
      ),
      orderWeek: this.apiService.getAdminOrderStats('week').pipe(
        catchError(() =>
          of({
            totalOrders: 0,
            completedOrders: 0,
            averageOrderValue: 0,
            revenue: 0,
          }),
        ),
      ),
      orderDay: this.apiService.getAdminOrderStats('day').pipe(
        catchError(() =>
          of({
            totalOrders: 0,
            completedOrders: 0,
            averageOrderValue: 0,
            revenue: 0,
          }),
        ),
      ),
      products: this.apiService.getProducts().pipe(catchError(() => of([]))),
      offers: this.apiService.getOffers().pipe(catchError(() => of([]))),
      warehouses: this.apiService.getWarehouses().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({
        topProducts,
        users,
        orderMonth,
        orderWeek,
        orderDay,
        products,
        offers,
        warehouses,
      }) => {
        this.topProducts = topProducts.slice(0, 8);
        this.activeUsers = users.filter((user) => user.enabled).length;
        this.disabledUsers = users.filter((user) => !user.enabled).length;
        this.logisticsUsers = users.filter((user) => this.hasRole(user.roles, 'LOGISTICS')).length;
        this.deliveryUsers = users.filter((user) => this.hasRole(user.roles, 'DELIVERY')).length;

        this.totalOrdersMonth = this.normalizeNumber(orderMonth.totalOrders);
        this.totalOrdersWeek = this.normalizeNumber(orderWeek.totalOrders);
        this.totalOrdersDay = this.normalizeNumber(orderDay.totalOrders);
        this.completedOrdersMonth = this.normalizeNumber(orderMonth.completedOrders);
        this.averageOrderValueMonth = this.normalizeNumber(orderMonth.averageOrderValue);
        this.revenueMonth = this.normalizeNumber(orderMonth.revenue);

        this.totalProducts = products.length;
        this.activeOffers = offers.filter((offer) => offer.active !== false).length;
        this.activeWarehouses = warehouses.filter(
          (warehouse) => warehouse.isActive !== false,
        ).length;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar las estadisticas del ultimo mes.';
      },
    });
  }

  get completionRate(): number {
    if (this.totalOrdersMonth <= 0) {
      return 0;
    }
    return this.normalizeNumber((this.completedOrdersMonth / this.totalOrdersMonth) * 100);
  }

  private hasRole(roles: string[] | undefined, expectedRole: string): boolean {
    if (!roles?.length) {
      return false;
    }
    const normalizedExpected = expectedRole.toUpperCase().replace(/^ROLE_/, '');
    return roles.some((role) => role.toUpperCase().replace(/^ROLE_/, '') === normalizedExpected);
  }

  private normalizeNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Consulta endpoint de salud para mostrar estado de base de datos.
  checkDatabaseHealth(): void {
    this.apiService.checkAdminHealth().subscribe({
      next: (response: Record<string, unknown>) => {
        const databaseRaw = response['database'];
        const messageRaw = response['message'];
        this.databaseStatus = typeof databaseRaw === 'string' ? databaseRaw : 'UNKNOWN';
        this.databaseMessage = typeof messageRaw === 'string' ? messageRaw : 'Estado desconocido';
        this.usersInDatabase = Number(response['usersInDatabase']) || 0;
      },
      error: () => {
        this.databaseStatus = 'ERROR';
        this.databaseMessage = 'No se puede verificar la conexión a la base de datos.';
      },
    });
  }
}
