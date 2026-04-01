import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
// Servicio simple legacy para persistir rol en localStorage.
export class AuthService {
  private userRole: 'client' | 'admin' | 'logistics' | null = null;

  // Guarda el rol activo en memoria y almacenamiento local.
  login(role: 'client' | 'admin' | 'logistics') {
    this.userRole = role;
    localStorage.setItem('userRole', role);
  }

  // Limpia el rol de sesion actual.
  logout() {
    this.userRole = null;
    localStorage.removeItem('userRole');
  }

  // Devuelve el rol en memoria o recuperado del navegador.
  getUserRole(): 'client' | 'admin' | 'logistics' | null {
    return this.userRole ?? (localStorage.getItem('userRole') as any) ?? null;
  }

  // Indica si existe una sesion basada en rol.
  isLoggedIn(): boolean {
    return this.getUserRole() !== null;
  }
}