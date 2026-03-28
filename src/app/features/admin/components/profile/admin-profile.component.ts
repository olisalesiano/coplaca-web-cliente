import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../core/api.service';
import { AdminUserDTO, TopProductStatDTO, UserDTO, WarehouseDTO } from '../../../../core/api.models';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css'],
})
// Vista de perfil admin con resumen ejecutivo de operacion y usuarios.
export class AdminProfileComponent implements OnInit {
  loading = false;
  error = '';

  user: UserDTO | null = null;
  internalUsers: AdminUserDTO[] = [];
  activeInternalUsers: AdminUserDTO[] = [];
  disabledInternalUsers: AdminUserDTO[] = [];
  warehouses: WarehouseDTO[] = [];
  topProducts: TopProductStatDTO[] = [];
  totalProducts = 0;
  activeOffers = 0;
  totalOrders = 0;
  completedOrders = 0;
  averageOrderValue = 0;
  totalRevenue = 0;
  ordersToday = 0;

  constructor(private readonly apiService: ApiService) {}

  // Inicializa perfil y metricas del dashboard administrativo.
  ngOnInit(): void {
    this.loadProfileData();
  }

  get rolesLabel(): string {
    if (!this.user?.roles?.length) {
      return 'Sin roles';
    }

    return this.user.roles.join(', ');
  }

  get logisticsCount(): number {
    return this.activeInternalUsers.filter((user) => this.hasRole(user, 'ROLE_LOGISTICS')).length;
  }

  get deliveryCount(): number {
    return this.activeInternalUsers.filter((user) => this.hasRole(user, 'ROLE_DELIVERY')).length;
  }

  get disabledCount(): number {
    return this.disabledInternalUsers.length;
  }

  get activeInternalCount(): number {
    return this.activeInternalUsers.length;
  }

  get activeWarehousesCount(): number {
    return this.warehouses.filter((warehouse) => warehouse.isActive !== false).length;
  }

  // Carga usuario autenticado y desencadena consultas agregadas del dashboard.
  private loadProfileData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.loadDashboardData();
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el perfil de administrador.';
      },
    });
  }

  // Consolida datos de multiples endpoints para construir KPIs de administracion.
  private loadDashboardData(): void {
    forkJoin({
      users: this.apiService.getAdminUsers().pipe(catchError(() => of([]))),
      activeUsers: this.apiService.getAdminActiveUsers().pipe(catchError(() => of([]))),
      disabledUsers: this.apiService.getAdminDisabledUsers().pipe(catchError(() => of([]))),
      warehouses: this.apiService.getWarehouses().pipe(catchError(() => of([]))),
      topProducts: this.apiService.getTopSellingProductsLastMonth().pipe(catchError(() => of([]))),
      products: this.apiService.getProducts().pipe(catchError(() => of([]))),
      offers: this.apiService.getOffers().pipe(catchError(() => of([]))),
      orderStats: this.apiService.getAdminOrderStats('month').pipe(
        catchError(() =>
          of({
            totalOrders: 0,
            completedOrders: 0,
            averageOrderValue: 0,
            revenue: 0,
          }),
        ),
      ),
      ordersToday: this.apiService.getAdminOrdersToday().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({
        users,
        activeUsers,
        disabledUsers,
        warehouses,
        topProducts,
        products,
        offers,
        orderStats,
        ordersToday,
      }) => {
        this.internalUsers = users;
        this.activeInternalUsers = activeUsers.length > 0 ? activeUsers : users.filter((user) => user.enabled);
        this.disabledInternalUsers =
          disabledUsers.length > 0 ? disabledUsers : users.filter((user) => !user.enabled);
        this.warehouses = warehouses;
        this.topProducts = topProducts.slice(0, 5);
        this.totalProducts = products.length;
        this.activeOffers = offers.filter((offer) => offer.active !== false).length;

        this.totalOrders = this.normalizeNumber(orderStats.totalOrders);
        this.completedOrders = this.normalizeNumber(orderStats.completedOrders);
        this.averageOrderValue = this.normalizeNumber(orderStats.averageOrderValue);
        this.totalRevenue = this.normalizeNumber(orderStats.revenue);
        this.ordersToday = ordersToday.length;

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudieron cargar las estadisticas de administracion.';
      },
    });
  }

  private normalizeNumber(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private hasRole(user: AdminUserDTO, expectedRole: string): boolean {
    return user.roles?.some((role) => role.toUpperCase() === expectedRole) ?? false;
  }
}
