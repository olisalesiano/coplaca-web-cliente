import { Injectable } from '@angular/core';
import { LoginResponse } from './api.models';

const TOKEN_KEY = 'coplaca_token';
const SESSION_KEY = 'coplaca_session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
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

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}
