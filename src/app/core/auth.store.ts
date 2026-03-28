import { Injectable } from '@angular/core';
import { LoginResponse } from './api.models';

const TOKEN_KEY = 'coplaca_token';
const SESSION_KEY = 'coplaca_session';

export type AppRole = 'customer' | 'admin' | 'logistics' | 'delivery' | 'guest';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Persiste token y sesion completa devuelta por backend.
  setSession(session: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  getSession(): LoginResponse | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginResponse;
    } catch {
      return null;
    }
  }

  // Scope estable de usuario para aislar datos entre cuentas (pedidos/carrito).
  getUserScope(): string {
    const session = this.getSession();
    if (!session) {
      return 'guest';
    }

    if (session.id !== undefined && session.id !== null) {
      return `id_${session.id}`;
    }

    if (session.email) {
      return `email_${session.email.toLowerCase().replaceAll(/[^a-z0-9]/g, '_')}`;
    }

    return 'guest';
  }

  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  }

  isLoggedIn(): boolean {
    return this.getToken().length > 0;
  }

  // Normaliza roles de backend (ROLE_ADMIN, ROLE_CUSTOMER...) al vocabulario de la app.
  getNormalizedRoles(): AppRole[] {
    const session = this.getSession();
    if (!session?.roles?.length) {
      return ['guest'];
    }

    const normalized = session.roles
      .map((rawRole) => this.mapRole(rawRole))
      .filter((role): role is AppRole => role !== null);

    return normalized.length > 0 ? normalized : ['guest'];
  }

  // Regla de prioridad para obtener el rol principal de navegacion.
  getPrimaryRole(): AppRole {
    const roles = this.getNormalizedRoles();
    if (roles.includes('admin')) {
      return 'admin';
    }
    if (roles.includes('logistics')) {
      return 'logistics';
    }
    if (roles.includes('delivery')) {
      return 'delivery';
    }
    if (roles.includes('customer')) {
      return 'customer';
    }

    return 'guest';
  }

  hasAnyRole(expectedRoles: AppRole[]): boolean {
    const currentRoles = this.getNormalizedRoles();
    return expectedRoles.some((expectedRole) => currentRoles.includes(expectedRole));
  }

  // Devuelve la ruta por defecto segun rol principal.
  getDefaultRouteForCurrentRole(): string {
    const role = this.getPrimaryRole();
    switch (role) {
      case 'admin':
        return '/admin/users';
      case 'logistics':
        return '/logistics/orders';
      case 'customer':
      case 'delivery':
        return '/client/our-products';
      default:
        return '/login';
    }
  }

  // Parser flexible para soportar variaciones de nombres de rol del backend.
  private mapRole(role: string): AppRole | null {
    const normalized = role.toUpperCase();

    if (normalized.includes('ADMIN')) {
      return 'admin';
    }
    if (normalized.includes('LOGISTIC')) {
      return 'logistics';
    }
    if (normalized.includes('DELIVERY') || normalized.includes('REPARTIDOR')) {
      return 'delivery';
    }
    if (normalized.includes('CUSTOMER') || normalized.includes('CLIENT')) {
      return 'customer';
    }

    return null;
  }

  // Limpia toda la huella local de autenticacion.
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}
