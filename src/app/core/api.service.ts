import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthStore } from './auth.store';
import { LoginResponse, OrderDTO, ProductDTO, UserDTO } from './api.models';

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
  private readonly baseUrl = (globalThis as { __COPLACA_API_URL__?: string }).__COPLACA_API_URL__ ?? 'http://localhost:8080';

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
      return this.http.get<ProductDTO[]>(`${this.baseUrl}/products/search?query=${encodeURIComponent(query.trim())}`);
    }

    return this.http.get<ProductDTO[]>(`${this.baseUrl}/products`);
  }

  getCurrentUser(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.baseUrl}/users/me`, { headers: this.authHeaders() });
  }

  updateCurrentUser(payload: unknown): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.baseUrl}/users/me`, payload, { headers: this.authHeaders() });
  }

  deleteCurrentUser(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/me`, { headers: this.authHeaders() });
  }

  getMyOrders(): Observable<OrderDTO[]> {
    return this.http.get<OrderDTO[]>(`${this.baseUrl}/orders/my`, { headers: this.authHeaders() });
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

  private authHeaders(): HttpHeaders {
    const token = this.authStore.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }
}
