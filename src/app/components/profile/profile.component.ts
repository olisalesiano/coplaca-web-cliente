import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { AuthStore } from '../../core/auth.store';
import { UserDTO } from '../../core/api.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  user: UserDTO | null = null;
  firstName = '';
  lastName = '';
  phoneNumber = '';
  street = '';
  streetNumber = '';
  apartment = '';
  city = '';
  province = '';
  postalCode = '';
  additionalInfo = '';
  message = '';

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authStore: AuthStore,
  ) {
    this.loadProfile();
  }

  loadProfile(): void {
    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.phoneNumber = user.phoneNumber ?? '';
        this.street = user.address?.street ?? '';
        this.streetNumber = user.address?.streetNumber ?? '';
        this.apartment = user.address?.apartment ?? '';
        this.city = user.address?.city ?? '';
        this.province = user.address?.province ?? '';
        this.postalCode = user.address?.postalCode ?? '';
        this.additionalInfo = user.address?.additionalInfo ?? '';
      },
      error: () => {
        this.message = 'No se pudo cargar tu perfil.';
      },
    });
  }

  goToShop(): void {
    this.router.navigate(['/our-products']);
  }
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }
  goToCart(): void {
    this.router.navigate(['/cart']);
  }
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
  editInfo(): void {
    this.apiService
      .updateCurrentUser({
        firstName: this.firstName,
        lastName: this.lastName,
        phoneNumber: this.phoneNumber,
        address: {
          street: this.street,
          streetNumber: this.streetNumber,
          apartment: this.apartment,
          city: this.city,
          province: this.province,
          postalCode: this.postalCode,
          additionalInfo: this.additionalInfo,
          latitude: 0,
          longitude: 0,
        },
      })
      .subscribe({
        next: () => {
          this.message = 'Perfil actualizado.';
          this.loadProfile();
        },
        error: () => {
          this.message = 'No se pudo actualizar el perfil.';
        },
      });
  }

  darDeBaja(): void {
    this.apiService.deleteCurrentUser().subscribe({
      next: () => {
        this.authStore.clear();
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.message = 'No se pudo tramitar la baja de cuenta.';
      },
    });
  }
  irAPedidos(): void {
    this.router.navigate(['/orders']);
  }
}
