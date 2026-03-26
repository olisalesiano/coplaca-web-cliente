import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthStore } from '../../core/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authStore: AuthStore,
  ) {}

  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Debes introducir email y contrasena.';
      return;
    }

    this.loading = true;
    this.apiService.login(this.email, this.password).subscribe({
      next: (session) => {
        this.authStore.setSession(session);
        this.loading = false;
        void this.router.navigate(['/our-products']);
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractLoginErrorMessage(httpError);
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  private extractLoginErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'No se pudo iniciar sesion. Revisa tus credenciales.';
    }

    if (error.status === 401 || error.status === 400) {
      return 'Contrasena incorrecta o email no registrado.';
    }

    const backendMessage = this.extractBackendMessage(error.error as { message?: string; error?: string } | string | null);
    if (backendMessage) {
      return backendMessage;
    }

    return 'No se pudo iniciar sesion. Revisa tus credenciales.';
  }

  private extractBackendMessage(payload: { message?: string; error?: string } | string | null): string | null {
    if (typeof payload === 'string') {
      const text = payload.trim();
      return text.length > 0 ? text : null;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const message = payload.message?.trim();
    if (message) {
      return message;
    }

    const errorText = payload.error?.trim();
    return errorText || null;
  }
}
