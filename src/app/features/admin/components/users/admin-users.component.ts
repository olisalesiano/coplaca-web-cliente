import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../../core/api.service';
import { AdminUserDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
})
export class AdminUsersComponent implements OnInit {
  logisticsUsers: AdminUserDTO[] = [];
  deliveryUsers: AdminUserDTO[] = [];
  loading = false;
  processingUserId: number | null = null;
  error = '';
  warning = '';
  message = '';

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.warning = '';
    this.message = '';

    this.apiService.getAdminUsers().subscribe({
      next: (users) => {
        this.logisticsUsers = users.filter((user) => this.hasRole(user, 'ROLE_LOGISTICS'));
        this.deliveryUsers = users.filter((user) => this.hasRole(user, 'ROLE_DELIVERY'));

        if (this.logisticsUsers.length === 0 && this.deliveryUsers.length === 0) {
          this.warning = 'No hay cuentas internas de logistica o reparto para mostrar.';
        }

        this.loading = false;
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(httpError, 'No se pudieron cargar las cuentas de logistica y reparto.');
      },
    });
  }

  toggleUserEnabled(user: AdminUserDTO): void {
    if (this.processingUserId !== null) {
      this.warning = 'Hay una operacion en curso. Espera a que termine para continuar.';
      return;
    }

    const actionText = user.enabled ? 'desactivar' : 'reactivar';
    const confirmed = confirm(`Vas a ${actionText} la cuenta de ${user.email}. Esta accion afecta el acceso del usuario. ¿Deseas continuar?`);
    if (!confirmed) {
      this.warning = 'Accion cancelada por seguridad.';
      return;
    }

    this.processingUserId = user.id;
    this.message = '';
    this.error = '';
    this.warning = '';
    this.apiService.updateAdminUserStatus(user.id, !user.enabled).subscribe({
      next: () => {
        user.enabled = !user.enabled;
        this.message = user.enabled
          ? `Cuenta ${user.email} reactivada correctamente.`
          : `Cuenta ${user.email} desactivada correctamente.`;
        this.processingUserId = null;
      },
      error: (httpError: unknown) => {
        this.processingUserId = null;
        this.error = this.extractErrorMessage(httpError, 'No se pudo actualizar el estado de la cuenta.');
      },
    });
  }

  isProcessing(userId: number): boolean {
    return this.processingUserId === userId;
  }

  trackByUserId(_: number, user: AdminUserDTO): number {
    return user.id;
  }

  private hasRole(user: AdminUserDTO, expectedRole: string): boolean {
    return user.roles?.some((role) => role.toUpperCase() === expectedRole) ?? false;
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 401) {
      return 'Sesion caducada. Inicia sesion de nuevo.';
    }
    if (error.status === 403) {
      return 'No tienes permisos suficientes para esta operacion.';
    }
    if (error.status === 404) {
      return 'El recurso solicitado ya no existe o no se encontro.';
    }

    const payload = error.error as { message?: string; error?: string } | string | null;
    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload.trim();
    }
    if (payload && typeof payload === 'object') {
      const backendMessage = payload.message?.trim() || payload.error?.trim();
      if (backendMessage) {
        return backendMessage;
      }
    }

    return fallback;
  }
}
