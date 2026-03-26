import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userRole: 'client' | 'admin' | 'logistics' | null = null;

  login(role: 'client' | 'admin' | 'logistics') {
    this.userRole = role;
    localStorage.setItem('userRole', role);
  }

  logout() {
    this.userRole = null;
    localStorage.removeItem('userRole');
  }

  getUserRole(): 'client' | 'admin' | 'logistics' | null {
    return this.userRole ?? (localStorage.getItem('userRole') as any) ?? null;
  }

  isLoggedIn(): boolean {
    return this.getUserRole() !== null;
  }
}