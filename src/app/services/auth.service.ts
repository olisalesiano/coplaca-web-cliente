import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/auth`;

  constructor(private http: HttpClient) {}

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: any;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signup`, {
      ...data,
      role: 'CUSTOMER',
    });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
