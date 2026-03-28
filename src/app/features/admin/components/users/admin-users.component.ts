import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/api.service';
import { AdminUserDTO, UserDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
})
// Gestion de usuarios internos: listado, filtros, edicion, roles y activacion/baja.
export class AdminUsersComponent implements OnInit {
  users: AdminUserDTO[] = [];
  searchTerm = '';
  selectedRoleFilter: 'ALL' | 'LOGISTICS' | 'DELIVERY' | 'CUSTOMER' = 'ALL';
  selectedStatusFilter: 'ALL' | 'ACTIVE' | 'DISABLED' = 'ALL';
  isEditDialogOpen = false;
  editingUserId: number | null = null;
  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'CUSTOMER' as 'ADMIN' | 'LOGISTICS' | 'DELIVERY' | 'CUSTOMER',
    enabled: true,
    warehouseName: '',
  };
  loading = false;
  processingUserId: number | null = null;
  error = '';
  warning = '';
  message = '';

  constructor(private readonly apiService: ApiService) {}

  // Carga inicial del modulo de usuarios.
  ngOnInit(): void {
    this.loadUsers();
  }

  // Recupera cuentas desde backend y actualiza mensajes de estado para la UI.
  loadUsers(preserveMessage = false): void {
    this.loading = true;
    this.error = '';
    this.warning = '';
    if (!preserveMessage) {
      this.message = '';
    }

    this.apiService.getAdminUsers().subscribe({
      next: (users) => {
        this.users = users;

        if (this.users.length === 0) {
          this.warning = 'No hay cuentas para mostrar.';
        }

        this.loading = false;
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(httpError, 'No se pudieron cargar las cuentas de logistica y reparto.');
      },
    });
  }

  // Abre modal de edicion y carga detalle completo del usuario seleccionado.
  editUser(user: AdminUserDTO): void {
    this.error = '';
    this.warning = '';
    this.message = '';
    // Modal abre al instante para mejor UX, datos cargan en segundo plano
    this.editingUserId = user.id;
    this.isEditDialogOpen = true;
    this.apiService.getAdminUserById(user.id).subscribe({
      next: (detail) => {
        this.openEditDialog(detail);
      },
      error: (httpError: unknown) => {
        this.error = this.extractErrorMessage(httpError, 'No se pudo cargar el detalle.');
        this.cancelEdit();
      },
    });
  }

  private openEditDialog(detail: UserDTO): void {
    if (detail.id !== this.editingUserId) {
      return; // Cerrado mientras cargaba en segundo plano
    }
    const role = this.resolvePrimaryRole(detail.roles ?? []);
    this.editForm = {
      firstName: detail.firstName ?? '',
      lastName: detail.lastName ?? '',
      email: detail.email ?? '',
      phoneNumber: detail.phoneNumber ?? '',
      role,
      enabled: detail.enabled,
      warehouseName: detail.warehouseName ?? 'No asignado',
    };
  }

  cancelEdit(): void {
    this.isEditDialogOpen = false;
    this.editingUserId = null;
    this.editForm = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'CUSTOMER',
      enabled: true,
      warehouseName: '',
    };
  }

  @HostListener('window:keydown.escape')
  onEscapePressed(): void {
    if (!this.isEditDialogOpen) {
      return;
    }

    this.cancelEdit();
  }

  // Guarda cambios de perfil y despues aplica cambios de rol/estado si corresponde.
  saveEdit(): void {
    if (this.editingUserId === null) {
      return;
    }

    if (this.processingUserId !== null) {
      this.warning = 'Hay una operacion en curso. Espera a que termine para continuar.';
      return;
    }

    const firstName = this.editForm.firstName.trim();
    const lastName = this.editForm.lastName.trim();
    const email = this.editForm.email.trim().toLowerCase();
    const phoneNumber = this.editForm.phoneNumber.trim();

    if (!firstName || !lastName || !email) {
      this.error = 'Nombre, apellido y email son obligatorios.';
      return;
    }

    this.processingUserId = this.editingUserId;
    this.error = '';
    this.warning = '';
    this.message = '';

    this.apiService.getAdminUserById(this.editingUserId).subscribe({
      next: (beforeUpdate) => {
        const previousRole = this.resolvePrimaryRole(beforeUpdate.roles ?? []);
        const previousEnabled = beforeUpdate.enabled;

        this.apiService
          .updateAdminUser(this.editingUserId!, {
            firstName,
            lastName,
            email,
            phoneNumber,
          })
          .subscribe({
            next: () => {
              this.applyRoleAndStatusChanges(previousRole, previousEnabled, email);
            },
            error: (httpError: unknown) => {
              this.processingUserId = null;
              this.error = this.extractErrorMessage(httpError, 'No se pudo actualizar la cuenta.');
            },
          });
      },
      error: (httpError: unknown) => {
        this.processingUserId = null;
        this.error = this.extractErrorMessage(httpError, 'No se pudo recuperar el estado actual del usuario.');
      },
    });
  }

  // Secuencia de actualizacion segura: rol y estado se aplican en pasos independientes.
  private applyRoleAndStatusChanges(previousRole: string, previousEnabled: boolean, email: string): void {
    const roleChanged = this.editForm.role !== previousRole;
    const statusChanged = this.editForm.enabled !== previousEnabled;

    const continueWithStatusUpdate = (): void => {
      if (!statusChanged) {
        this.finishEditSuccess(email);
        return;
      }

      this.apiService.updateAdminUserStatus(this.editingUserId!, this.editForm.enabled).subscribe({
        next: () => this.finishEditSuccess(email),
        error: (httpError: unknown) => {
          this.processingUserId = null;
          this.error = this.extractErrorMessage(httpError, 'Se actualizo el perfil pero no el estado.');
        },
      });
    };

    if (!roleChanged) {
      continueWithStatusUpdate();
      return;
    }

    this.apiService
      .updateAdminUserRoles(this.editingUserId!, [this.editForm.role])
      .subscribe({
        next: () => continueWithStatusUpdate(),
        error: (httpError: unknown) => {
          this.processingUserId = null;
          this.error = this.extractErrorMessage(httpError, 'Se actualizo el perfil pero no el rol.');
        },
      });
  }

  private finishEditSuccess(email: string): void {
    this.processingUserId = null;
    this.isEditDialogOpen = false;
    this.editingUserId = null;
    this.message = `Cuenta ${email} actualizada correctamente.`;
    this.loadUsers(true);
  }

  // Elimina definitivamente una cuenta tras confirmacion del administrador.
  deleteUser(user: AdminUserDTO): void {
    if (this.processingUserId !== null) {
      this.warning = 'Hay una operacion en curso. Espera a que termine para continuar.';
      return;
    }

    const confirmed = confirm(
      `Vas a eliminar la cuenta de ${user.email}. Si el usuario tiene algo pendiente no se permitira borrar. ¿Estas seguro?`,
    );
    if (!confirmed) {
      this.warning = 'Accion cancelada por seguridad.';
      return;
    }

    this.processingUserId = user.id;
    this.message = '';
    this.error = '';
    this.warning = '';
    this.apiService.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.message = `Cuenta ${user.email} eliminada correctamente.`;
        this.processingUserId = null;
        this.loadUsers(true);
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

  get filteredUsers(): AdminUserDTO[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.users.filter((user) => {
      const roleMatch = this.selectedRoleFilter === 'ALL' || this.hasRole(user, this.selectedRoleFilter);
      let statusMatch = true;
      if (this.selectedStatusFilter === 'ACTIVE') {
        statusMatch = user.enabled;
      } else if (this.selectedStatusFilter === 'DISABLED') {
        statusMatch = !user.enabled;
      }

      const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.toLowerCase();
      const email = (user.email ?? '').toLowerCase();
      const searchMatch =
        term.length === 0 ||
        fullName.includes(term) ||
        email.includes(term);

      return roleMatch && statusMatch && searchMatch;
    });
  }

  getRoleLabel(user: AdminUserDTO): string {
    if (this.hasRole(user, 'ADMIN')) {
      return 'Administrador';
    }
    if (this.hasRole(user, 'LOGISTICS')) {
      return 'Logistica';
    }
    if (this.hasRole(user, 'DELIVERY')) {
      return 'Repartidor';
    }
    if (this.hasRole(user, 'CUSTOMER')) {
      return 'Cliente';
    }
    return 'Otro';
  }

  private resolvePrimaryRole(roles: string[]): 'ADMIN' | 'LOGISTICS' | 'DELIVERY' | 'CUSTOMER' {
    const normalized = new Set(roles.map((role) => role.toUpperCase().replace(/^ROLE_/, '')));
    if (normalized.has('ADMIN')) {
      return 'ADMIN';
    }
    if (normalized.has('LOGISTICS')) {
      return 'LOGISTICS';
    }
    if (normalized.has('DELIVERY')) {
      return 'DELIVERY';
    }
    return 'CUSTOMER';
  }

  private hasRole(user: AdminUserDTO, expectedRole: string): boolean {
    const normalizedExpectedRole = expectedRole.toUpperCase().replace(/^ROLE_/, '');
    return (
      user.roles?.some(
        (role) => role.toUpperCase().replace(/^ROLE_/, '') === normalizedExpectedRole,
      ) ?? false
    );
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
