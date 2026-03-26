import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthStore } from './auth.store';
import {
  AdminUserDTO,
  DeliveryWorkerDTO,
  LogisticsOrderDTO,
  LoginResponse,
  OrderDTO,
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
  private readonly baseUrl = resolveApiBaseUrl();

  constructor(
    private readonly http: HttpClient,
    private readonly authStore: AuthStore,
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password });
  }

  signup(payload: SignUpPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/signup`, payload);
  }

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

  createOrder(items: Array<{ productId: number; quantity: number }>): Observable<OrderDTO> {
    return this.http.post<OrderDTO>(
      `${this.baseUrl}/orders`,
      {
        paymentMethod: 'CARD',
        paymentStatus: 'PENDING',
        items,
      },
      { headers: this.authHeaders() },
    );
  }

  getWarehouses(): Observable<WarehouseDTO[]> {
    return this.http
      .get<WarehouseDTO[] | ApiSuccessResponse<WarehouseDTO[]>>(`${this.baseUrl}/api/v1/warehouses`)
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getAdminUsers(): Observable<AdminUserDTO[]> {
    return this.http
      .get<AdminUserDTO[] | ApiSuccessResponse<AdminUserDTO[]>>(
        `${this.baseUrl}/api/v1/admin/users`,
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

  getTopSellingProductsLastMonth(): Observable<TopProductStatDTO[]> {
    return this.http
      .get<Array<TopProductStatDTO | string> | ApiSuccessResponse<Array<TopProductStatDTO | string>>>(
        `${this.baseUrl}/api/v1/admin/stats/top-products`,
        { headers: this.authHeaders() },
      )
      .pipe(
        map((response) => this.unwrapListResponse(response)),
        map((items) =>
          items.map((item, index) =>
            typeof item === 'string'
              ? { productId: index + 1, productName: item, unitsSold: 0 }
              : item,
          ),
        ),
      );
  }

  getLogisticsOrders(warehouseId: number): Observable<LogisticsOrderDTO[]> {
    return this.http
      .get<LogisticsOrderDTO[] | ApiSuccessResponse<LogisticsOrderDTO[]>>(
        `${this.baseUrl}/api/v1/orders/warehouse/${warehouseId}/pending`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  getAvailableDeliveryWorkers(warehouseId: number): Observable<DeliveryWorkerDTO[]> {
    return this.http
      .get<DeliveryWorkerDTO[] | ApiSuccessResponse<DeliveryWorkerDTO[]>>(
        `${this.baseUrl}/api/v1/warehouses/${warehouseId}/delivery-agents`,
        { headers: this.authHeaders() },
      )
      .pipe(map((response) => this.unwrapListResponse(response)));
  }

  assignOrderToDelivery(orderId: number, deliveryUserId: number): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/api/v1/orders/${orderId}/assign/${deliveryUserId}`,
      {},
      { headers: this.authHeaders() },
    );
  }

  updateLogisticsProductStock(productId: number, delta: number): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/api/v1/products/${productId}/stock?delta=${encodeURIComponent(delta)}`,
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

  private authHeaders(): HttpHeaders {
    const token = this.authStore.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private unwrapListResponse<T>(response: T[] | ApiSuccessResponse<T[]>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  }

  private unwrapSingleResponse<T>(response: T | ApiSuccessResponse<T>): T {
    if (response && typeof response === 'object' && 'data' in response) {
      if (response.data !== undefined) {
        return response.data;
      }
    }

    return response as T;
  }
}
