import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { AuthStore } from './auth.store';
import {
  AdminUserDTO,
  DeliveryWorkerDTO,
  LogisticsOrderDTO,
  LoginResponse,
  OrderDTO,
  ProductCategoryDTO,
  ProductDTO,
  SeasonalOfferDTO,
  TopProductStatDTO,
  UserDTO,
  WarehouseDTO,
} from './api.models';
import { resolveApiBaseUrl } from './api-base-url';

interface ApiSuccessResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AdminOrderStatsDTO {
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  revenue: number;
}

interface AdminUserStatsDTO {
  totalUsers: number;
  activeUsers: number;
  byRole: Record<string, number>;
}

interface SignUpPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  address: {
    street: string;
    streetNumber: string;
    apartment?: string;
    city: string;
    postalCode: string;
    province: string;
    additionalInfo?: string;
    latitude: number;
    longitude: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Resuelve URL base de API con soporte para override runtime y fallback de entorno.
  private readonly baseUrl = resolveApiBaseUrl();

  constructor(
    private readonly http: HttpClient,
    private readonly authStore: AuthStore,
  ) {}

  // -----------------------
  // Autenticacion
  // -----------------------
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password });
  }

  signup(payload: SignUpPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/signup`, payload);
  }

  // -----------------------
  // Catalogo y perfil del cliente
  // -----------------------
  getProducts(query?: string): Observable<ProductDTO[]> {
    if (query && query.trim().length > 0) {
      return this.http
        .get<ProductDTO[] | ApiSuccessResponse<ProductDTO[]>>(
          `${this.baseUrl}/api/v1/products/search?query=${encodeURIComponent(query.trim())}`,
        )
        .pipe(map((response) => this.unwrapListResponse(response)));
    }

    return this.http
      .get<ProductDTO[] | ApiSuccessResponse<ProductDTO[]>>(`${this.baseUrl}/api/v1/products`)
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getProductCategories(): Observable<ProductCategoryDTO[]> {
    return this.http
      .get<ProductCategoryDTO[] | ApiSuccessResponse<ProductCategoryDTO[]>>(
        `${this.baseUrl}/api/v1/categories`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  createLogisticsProduct(payload: {
    name: string;
    description: string;
    unit: string;
    unitPrice: number;
    stockQuantity: number;
    imageUrl?: string;
    origin?: string;
    nutritionInfo?: string;
    categoryId: number;
  }): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/api/v1/products`,
      {
        name: payload.name,
        description: payload.description,
        unit: payload.unit,
        unitPrice: payload.unitPrice,
        stockQuantity: payload.stockQuantity,
        imageUrl: payload.imageUrl || null,
        origin: payload.origin || null,
        nutritionInfo: payload.nutritionInfo || null,
        category: { id: payload.categoryId },
      },
      { headers: this.authHeaders() },
    );
  }

  getCurrentUser(): Observable<UserDTO> {
    return this.http
      .get<UserDTO | ApiSuccessResponse<UserDTO>>(`${this.baseUrl}/api/v1/users/me`, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  updateCurrentUser(payload: unknown): Observable<UserDTO> {
    return this.http
      .put<UserDTO | ApiSuccessResponse<UserDTO>>(`${this.baseUrl}/api/v1/users/me`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  deleteCurrentUser(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/users/me`, { headers: this.authHeaders() });
  }

  getMyOrders(): Observable<OrderDTO[]> {
    return this.http
      .get<OrderDTO[] | ApiSuccessResponse<OrderDTO[]>>(`${this.baseUrl}/api/v1/orders/me`, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  cancelOrder(orderId: number, reason?: string): Observable<void> {
    const payload = reason && reason.trim().length > 0 ? { reason: reason.trim() } : {};

    return this.http
      .put<void>(`${this.baseUrl}/api/v1/orders/${orderId}/cancel`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(
        catchError(() =>
          this.http.put<void>(`${this.baseUrl}/api/v1/orders/${orderId}/cancel`, null, {
            headers: this.authHeaders(),
          }),
        ),
      );
  }

  createOrder(
    items: Array<{ productId: number; quantity: number; unitPrice?: number; subtotal?: number }>,
    shippingAddressId?: number,
    totalPrice?: number,
  ): Observable<OrderDTO> {
    const payload: {
      paymentMethod: 'CARD';
      paymentStatus: 'PENDING';
      items: Array<{ productId: number; quantity: number; unitPrice?: number; subtotal?: number }>;
      shippingAddressId?: number;
      totalPrice?: number;
    } = {
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      items,
    };

    if (shippingAddressId !== undefined) {
      payload.shippingAddressId = shippingAddressId;
    }

    if (totalPrice !== undefined) {
      payload.totalPrice = totalPrice;
    }

    return this.http
      .post<OrderDTO | ApiSuccessResponse<OrderDTO>>(
      `${this.baseUrl}/api/v1/orders`,
      payload,
      { headers: this.authHeaders() },
    )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  getWarehouses(): Observable<WarehouseDTO[]> {
    return this.http
      .get<WarehouseDTO[] | ApiSuccessResponse<WarehouseDTO[]>>(`${this.baseUrl}/api/v1/warehouses`)
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  // -----------------------
  // Endpoints de administracion
  // -----------------------
  getAdminUsers(): Observable<AdminUserDTO[]> {
    return this.http
      .get<AdminUserDTO[] | ApiSuccessResponse<AdminUserDTO[]>>(
        `${this.baseUrl}/api/v1/admin/users`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getAdminUserById(userId: number): Observable<UserDTO> {
    return this.http
      .get<UserDTO | ApiSuccessResponse<UserDTO>>(`${this.baseUrl}/api/v1/users/${userId}`, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  getAdminActiveUsers(): Observable<AdminUserDTO[]> {
    return this.http
      .get<AdminUserDTO[] | ApiSuccessResponse<AdminUserDTO[]>>(
        `${this.baseUrl}/api/v1/admin/users/active`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getAdminDisabledUsers(): Observable<AdminUserDTO[]> {
    return this.http
      .get<AdminUserDTO[] | ApiSuccessResponse<AdminUserDTO[]>>(
        `${this.baseUrl}/api/v1/admin/users/disabled`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getAdminOrderStats(period: 'day' | 'week' | 'month' = 'month'): Observable<AdminOrderStatsDTO> {
    return this.http
      .get<AdminOrderStatsDTO | ApiSuccessResponse<AdminOrderStatsDTO>>(
        `${this.baseUrl}/api/v1/admin/stats/orders?period=${encodeURIComponent(period)}`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  getAdminUserStats(): Observable<AdminUserStatsDTO> {
    return this.http
      .get<AdminUserStatsDTO | ApiSuccessResponse<AdminUserStatsDTO>>(
        `${this.baseUrl}/api/v1/admin/stats/users`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  getAdminOrdersToday(): Observable<Array<Record<string, unknown>>> {
    return this.http
      .get<Array<Record<string, unknown>> | ApiSuccessResponse<Array<Record<string, unknown>>>>(
        `${this.baseUrl}/api/v1/admin/orders/today`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  updateAdminUserStatus(userId: number, enabled: boolean): Observable<void> {
    if (enabled) {
      return this.http.post<void>(
        `${this.baseUrl}/api/v1/admin/users/${userId}/reactivate`,
        {},
        { headers: this.authHeaders() },
      );
    }

    return this.http.delete<void>(`${this.baseUrl}/api/v1/admin/users/${userId}`, {
      headers: this.authHeaders(),
    });
  }

  updateAdminUser(
    userId: number,
    payload: { email?: string; firstName?: string; lastName?: string; phoneNumber?: string },
  ): Observable<AdminUserDTO> {
    return this.http
      .put<AdminUserDTO | ApiSuccessResponse<AdminUserDTO>>(
        `${this.baseUrl}/api/v1/users/${userId}`,
        payload,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  updateAdminUserRoles(userId: number, roles: string[]): Observable<UserDTO> {
    return this.http
      .put<UserDTO | ApiSuccessResponse<UserDTO>>(
        `${this.baseUrl}/api/v1/admin/users/${userId}/roles`,
        roles,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  deleteAdminUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/admin/users/${userId}`, {
      headers: this.authHeaders(),
    });
  }

  getTopSellingProductsLastMonth(): Observable<TopProductStatDTO[]> {
    return this.http
      .get<Array<Record<string, unknown>> | ApiSuccessResponse<Array<Record<string, unknown>>>>(
        `${this.baseUrl}/api/v1/admin/stats/top-products`,
        { headers: this.authHeaders() },
      )
      .pipe(
        map((response) => this.unwrapListResponse(response)),
        map((items) =>
          items.map<TopProductStatDTO>((item) => ({
            productId: Number(item['productId']) || 0,
            productName: typeof item['productName'] === 'string' ? item['productName'] : '',
            unitsSold: Number(item['unitsSold']) || 0,
          })),
        ),
      );
  }

  // -----------------------
  // Endpoints de logistica
  // -----------------------
  getLogisticsOrders(warehouseId: number): Observable<LogisticsOrderDTO[]> {
    return this.http
      .get<LogisticsOrderDTO[] | ApiSuccessResponse<LogisticsOrderDTO[]>>(
        `${this.baseUrl}/api/v1/orders/warehouse/${warehouseId}/pending`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getLogisticsAllOrders(warehouseId: number): Observable<LogisticsOrderDTO[]> {
    return this.http
      .get<LogisticsOrderDTO[] | ApiSuccessResponse<LogisticsOrderDTO[]>>(
        `${this.baseUrl}/api/v1/orders/warehouse/${warehouseId}/all`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getLogisticsConfirmedOrders(warehouseId: number): Observable<LogisticsOrderDTO[]> {
    return this.http
      .get<LogisticsOrderDTO[] | ApiSuccessResponse<LogisticsOrderDTO[]>>(
        `${this.baseUrl}/api/v1/orders/warehouse/${warehouseId}/confirmed`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getLogisticsInTransitOrders(warehouseId: number): Observable<LogisticsOrderDTO[]> {
    return this.http
      .get<LogisticsOrderDTO[] | ApiSuccessResponse<LogisticsOrderDTO[]>>(
        `${this.baseUrl}/api/v1/orders/warehouse/${warehouseId}/in-transit`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getLogisticsWarehouseStats(
    warehouseId: number,
    period: 'day' | 'week' | 'month' = 'month',
  ): Observable<Record<string, number>> {
    return this.http
      .get<Record<string, number> | ApiSuccessResponse<Record<string, number>>>(
        `${this.baseUrl}/api/v1/orders/warehouse/${warehouseId}/stats?period=${encodeURIComponent(period)}`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  getAvailableDeliveryWorkers(warehouseId: number): Observable<DeliveryWorkerDTO[]> {
    return this.http
      .get<DeliveryWorkerDTO[] | ApiSuccessResponse<DeliveryWorkerDTO[]>>(
        `${this.baseUrl}/api/v1/warehouses/${warehouseId}/delivery-agents`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  confirmOrder(orderId: number): Observable<OrderDTO> {
    return this.http
      .put<OrderDTO | ApiSuccessResponse<OrderDTO>>(
        `${this.baseUrl}/api/v1/orders/${orderId}/confirm`,
        {},
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapSingleResponse(response)));
  }

  assignOrderToDelivery(orderId: number, deliveryUserId: number): Observable<void> {
    // Soporta ambas variantes de endpoint segun version de backend.
    return this.http
      .put<void>(
        `${this.baseUrl}/api/v1/orders/${orderId}/assign/${deliveryUserId}`,
        {},
        { headers: this.authHeaders() },
      )
      .pipe(
        catchError(() =>
          this.http.put<void>(
            `${this.baseUrl}/api/v1/orders/${orderId}/assign`,
            { deliveryUserId },
            { headers: this.authHeaders() },
          ),
        ),
      );
  }

  updateLogisticsProductStock(productId: number, delta: number): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/api/v1/products/${productId}/stock?delta=${encodeURIComponent(delta)}`,
      {},
      { headers: this.authHeaders() },
    );
  }

  updateLogisticsProductPrice(productId: number, newUnitPrice: number): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/api/v1/products/${productId}/price?value=${encodeURIComponent(newUnitPrice)}`,
      {},
      { headers: this.authHeaders() },
    );
  }

  getOffers(): Observable<SeasonalOfferDTO[]> {
    return this.http
      .get<SeasonalOfferDTO[] | ApiSuccessResponse<SeasonalOfferDTO[]>>(`${this.baseUrl}/api/v1/offers`, {
        headers: this.authHeaders(),
      })
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  createOffer(productId: number, reason: string, discountPercentage: number): Observable<void> {
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.http.post<void>(
      `${this.baseUrl}/api/v1/offers`,
      {
        product: { id: productId },
        reason,
        discountPercentage,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        active: true,
      },
      { headers: this.authHeaders() },
    );
  }

  updateOffer(offerId: number, productId: number, reason: string, discountPercentage: number): Observable<void> {
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.http.put<void>(
      `${this.baseUrl}/api/v1/offers/${offerId}`,
      {
        id: offerId,
        product: { id: productId },
        reason,
        discountPercentage,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        active: true,
      },
      { headers: this.authHeaders() },
    );
  }

  checkAdminHealth(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/admin/health`,
      { headers: this.authHeaders() },
    );
  }

  // Construye cabeceras con bearer token para endpoints protegidos.
  private authHeaders(): HttpHeaders {
    const token = this.authStore.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Soporta respuestas tipo arreglo directo o envoltorio { success, data }.
  private unwrapListResponse<T>(response: T[] | ApiSuccessResponse<T[]>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }

  // Soporta respuestas tipo objeto directo o envoltorio { success, data }.
  private unwrapSingleResponse<T>(response: T | ApiSuccessResponse<T>): T {
    if (response && typeof response === 'object' && 'data' in response) {
      if (response.data !== undefined) {
        return response.data;
      }
    }

    return response as T;
  }
}
