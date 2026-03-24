import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/users`;

  constructor(private http: HttpClient) {}

  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me`, data);
  }

  getAddresses(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/addresses`);
  }

  addAddress(address: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addresses`, address);
  }

  updateAddress(addressId: number, address: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/addresses/${addressId}`, address);
  }

  deleteAddress(addressId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/addresses/${addressId}`);
  }
}
