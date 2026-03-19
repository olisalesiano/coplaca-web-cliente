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
