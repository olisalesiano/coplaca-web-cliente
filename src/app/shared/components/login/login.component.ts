import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';

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
      error: () => {
        this.loading = false;
        this.error = 'No se pudo iniciar sesion. Revisa tus credenciales.';
      },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}