import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
// Servicio HTTP para operaciones de pedidos del cliente.
export class OrderService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/orders`;

  constructor(private readonly http: HttpClient) {}

  // Crea pedido con items y direccion de envio.
  createOrder(items: Array<{ productId: number; quantity: number }>, shippingAddressId: number): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      paymentMethod: 'CARD',
      paymentStatus: 'PENDING',
      items,
      shippingAddressId,
    });
  }

  // Lista pedidos del usuario; opcionalmente filtra por estado.
  getMyOrders(status?: string): Observable<any> {
    if (!status) {
      return this.http.get<any>(`${this.apiUrl}/my`);
    }

    let params = new HttpParams();
    params = params.set('status', status);
    return this.http.get<any>(`${this.apiUrl}/my`, { params });
  }

  // Obtiene detalle de un pedido por id.
  getOrderDetails(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }

  // Cancela pedido con motivo opcional.
  cancelOrder(orderId: number, reason?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/cancel`, { reason });
  }

  // Obtiene ETA del pedido.
  getOrderETA(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/eta/${orderId}`);
  }

  // Alias del endpoint ETA mas reciente (misma URL actual).
  getOrderETALatest(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/eta/${orderId}`);
  }
}
