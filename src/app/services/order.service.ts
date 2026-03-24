import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(items: Array<{ productId: number; quantity: number }>, shippingAddressId: number): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      items,
      shippingAddressId,
    });
  }

  getMyOrders(status?: string): Observable<any> {
    if (!status) {
      return this.http.get<any>(`${this.apiUrl}/my`);
    }

    let params = new HttpParams();
    params = params.set('status', status);
    return this.http.get<any>(`${this.apiUrl}/my`, { params });
  }

  getOrderDetails(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }

  cancelOrder(orderId: number, reason?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/cancel`, { reason });
  }

  getOrderETA(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/eta/${orderId}`);
  }

  getOrderETALatest(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/eta/${orderId}`);
  }
}
