import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  phoneNumber = '';
  street = '';
  streetNumber = '';
  apartment = '';
  city = '';
  province = '';
  postalCode = '';
  additionalInfo = '';

  loading = false;
  error = '';

  showPassword = false;
  showConfirmPassword = false;
  showConfirmationModal = false;
  passwordErrors: string[] = [];

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authStore: AuthStore,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/client/login']);
  }

  private validatePassword(): boolean {
    this.passwordErrors = [];

    // Check if password is not empty
    if (!this.password || !this.password.trim()) {
      this.passwordErrors.push('La contraseña es requerida');
    }

    // Check if confirmation password is not empty
    if (!this.confirmPassword || !this.confirmPassword.trim()) {
      this.passwordErrors.push('La confirmación de contraseña es requerida');
    }

    // Check minimum length
    if (this.password && this.password.length < 8) {
      this.passwordErrors.push('La contraseña debe tener al menos 8 caracteres');
    }

    // Check for at least one uppercase letter
    if (this.password && !/[A-Z]/.test(this.password)) {
      this.passwordErrors.push('La contraseña debe contener al menos una mayúscula');
    }

    // Check for at least one lowercase letter
    if (this.password && !/[a-z]/.test(this.password)) {
      this.passwordErrors.push('La contraseña debe contener al menos una minúscula');
    }

    // Check for at least one number
    if (this.password && !/[0-9]/.test(this.password)) {
      this.passwordErrors.push('La contraseña debe contener al menos un número');
    }

    // Check if passwords match
    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.passwordErrors.push('Las contraseñas no coinciden');
    }

    return this.passwordErrors.length === 0;
  }

  openConfirmationModal(): void {
    // First validate password
    if (!this.validatePassword()) {
      return;
    }

    this.error = '';
    const required = [
      this.firstName,
      this.lastName,
      this.email,
      this.password,
      this.street,
      this.streetNumber,
      this.city,
      this.province,
      this.postalCode,
    ];

    if (required.some((value) => !value.trim())) {
      this.error = 'Completa todos los campos obligatorios, incluido el domicilio.';
      return;
    }

    // Show confirmation modal
    this.showConfirmationModal = true;
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.passwordErrors = [];
  }

  confirmRegister(): void {
    this.register();
  }

  register(): void {
    this.error = '';
    const required = [
      this.firstName,
      this.lastName,
      this.email,
      this.password,
      this.street,
      this.streetNumber,
      this.city,
      this.province,
      this.postalCode,
    ];

    if (required.some((value) => !value.trim())) {
      this.error = 'Completa todos los campos obligatorios, incluido el domicilio.';
      return;
    }

    this.loading = true;
    this.apiService
      .signup({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
        phoneNumber: this.phoneNumber,
        role: 'CUSTOMER',
        address: {
          street: this.street,
          streetNumber: this.streetNumber,
          apartment: this.apartment,
          city: this.city,
          postalCode: this.postalCode,
          province: this.province,
          additionalInfo: this.additionalInfo,
          latitude: 0,
          longitude: 0,
        },
      })
      .subscribe({
        next: (session) => {
          this.authStore.setSession(session);
          this.loading = false;
          void this.router.navigate(['/our-products']);
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo completar el registro.';
          this.showConfirmationModal = false;
        },
      });
  }
}


