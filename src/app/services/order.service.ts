import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  createOrder(items: Array<{ productId: number; quantity: number }>, shippingAddressId: number): Observable<any> {
    return this.http.post<any>(this.apiUrl, { items, shippingAddressId });
  }

  getMyOrders(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any>(this.apiUrl, { params });
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
