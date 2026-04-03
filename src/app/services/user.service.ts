import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
// Servicio HTTP para perfil y direcciones del usuario autenticado.
export class UserService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/users`;

  constructor(private readonly http: HttpClient) {}

  // Recupera datos del usuario actual.
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  // Actualiza perfil del usuario.
  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me`, data);
  }

  // Lista direcciones del usuario.
  getAddresses(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/addresses`);
  }

  // Crea una nueva direccion.
  addAddress(address: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addresses`, address);
  }

  // Actualiza direccion existente por id.
  updateAddress(addressId: number, address: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/addresses/${addressId}`, address);
  }

  // Elimina una direccion del usuario.
  deleteAddress(addressId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/addresses/${addressId}`);
  }
}
