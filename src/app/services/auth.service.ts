import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { resolveApiBaseUrl } from '../core/api-base-url';

@Injectable({
  providedIn: 'root'
})
// Servicio HTTP de autenticacion para login/registro y token local.
export class AuthService {
  private readonly apiUrl = `${resolveApiBaseUrl()}/auth`;

  constructor(private readonly http: HttpClient) {}

  // Registra usuario cliente y fuerza rol CUSTOMER en payload.
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

  // Ejecuta login contra backend y devuelve respuesta raw.
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password });
  }

  // Elimina token de autenticacion local.
  logout(): void {
    localStorage.removeItem('authToken');
  }

  // Recupera token persistido en navegador.
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Persiste token en navegador.
  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Indica si hay token disponible para sesion activa.
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
