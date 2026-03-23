import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthStore } from '../../core/auth.store';

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

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authStore: AuthStore,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
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
        },
      });
  }
}
