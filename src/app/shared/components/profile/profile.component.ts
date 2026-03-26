import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';
import { UserDTO } from '../../../core/api.models';
import { AddressGeoService } from '../../../core/address-geo.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  readonly metodosSaldo = ['paypal', 'tarjeta'] as const;
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
  isResolvingPostalCode = false;
  coordinates: { latitude: number; longitude: number } | null = null;
  nearestWarehouseName = '';
  nearestWarehouseDistanceKm: number | null = null;
  message = '';
  saldo = Number(sessionStorage.getItem('saldo') ?? '0');
  cantidadInput = '';
  metodoSaldo: 'paypal' | 'tarjeta' = 'paypal';
  paypalEmail = '';
  cardNumber = '';
  cardName = '';
  cardExpiry = '';
  cardCvv = '';
  profileImageError = false;
  editando = false;
  dialogAbierto = false;
  private originalForm: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    street: string;
    streetNumber: string;
    apartment: string;
    city: string;
    province: string;
    postalCode: string;
    additionalInfo: string;
    coordinates: { latitude: number; longitude: number } | null;
    nearestWarehouseName: string;
    nearestWarehouseDistanceKm: number | null;
  } | null = null;
  private postalCodeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly authStore: AuthStore,
    private readonly addressGeoService: AddressGeoService,
  ) {
    this.loadProfile();
  }

  loadProfile(): void {
    this.apiService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.profileImageError = false;
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
        this.coordinates =
          user.address?.latitude !== undefined && user.address?.longitude !== undefined
            ? {
                latitude: Number(user.address.latitude),
                longitude: Number(user.address.longitude),
              }
            : null;
        this.nearestWarehouseName = user.warehouseName ?? '';
        this.nearestWarehouseDistanceKm = null;
        this.originalForm = this.getCurrentFormValues();
      },
      error: () => {
        this.message = 'No se pudo cargar tu perfil.';
      },
    });
  }

  goToOrders(): void {
    this.router.navigate(['/client/orders']);
  }
  goToCart(): void {
    this.router.navigate(['/client/cart']);
  }
  goToProfile(): void {
    this.router.navigate(['/client/profile']);
  }
  goToOurProducts(): void { this.router.navigate(['/client/our-products']); }
  startEdit(): void {
    this.editando = true;
    this.message = '';
    this.originalForm = this.getCurrentFormValues();
  }

  closeEditDialog(): void {
    if (this.postalCodeTimer) {
      clearTimeout(this.postalCodeTimer);
      this.postalCodeTimer = null;
    }

    if (this.originalForm) {
      this.firstName = this.originalForm.firstName;
      this.lastName = this.originalForm.lastName;
      this.phoneNumber = this.originalForm.phoneNumber;
      this.street = this.originalForm.street;
      this.streetNumber = this.originalForm.streetNumber;
      this.apartment = this.originalForm.apartment;
      this.city = this.originalForm.city;
      this.province = this.originalForm.province;
      this.postalCode = this.originalForm.postalCode;
      this.additionalInfo = this.originalForm.additionalInfo;
      this.coordinates = this.originalForm.coordinates;
      this.nearestWarehouseName = this.originalForm.nearestWarehouseName;
      this.nearestWarehouseDistanceKm = this.originalForm.nearestWarehouseDistanceKm;
    }

    this.isResolvingPostalCode = false;

    this.editando = false;
  }

  async saveInfo(): Promise<void> {
    let resolvedCoordinates = this.coordinates;
    resolvedCoordinates ??= await this.resolveCoordinatesByPostalCode(this.postalCode);
    resolvedCoordinates ??= await this.addressGeoService.geocodeFromParts({
      street: this.street,
      streetNumber: this.streetNumber,
      city: this.city,
      province: this.province,
      postalCode: this.postalCode,
    });

    if (resolvedCoordinates === null) {
      this.message = 'No se pudo geolocalizar el domicilio. Ajusta la direccion.';
      return;
    }

    this.coordinates = resolvedCoordinates;
    await this.updateNearestWarehouse(
      resolvedCoordinates.latitude,
      resolvedCoordinates.longitude,
    );

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
          latitude: resolvedCoordinates.latitude,
          longitude: resolvedCoordinates.longitude,
          isDefault: false,
        },
      })
      .subscribe({
        next: () => {
          this.editando = false;
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

  abrirDialogoSaldo(): void {
    this.dialogAbierto = true;
    this.cantidadInput = '';
    this.metodoSaldo = 'paypal';
    this.paypalEmail = '';
    this.cardNumber = '';
    this.cardName = '';
    this.cardExpiry = '';
    this.cardCvv = '';
  }

  cerrarDialogoSaldo(): void {
    this.dialogAbierto = false;
    this.cantidadInput = '';
  }

  seleccionarMetodoSaldo(metodo: 'paypal' | 'tarjeta'): void {
    this.metodoSaldo = metodo;
  }

  get profileImageUrl(): string {
    const userWithImage = this.user as (UserDTO & {
      profileImageUrl?: string;
      avatarUrl?: string;
      imageUrl?: string;
    }) | null;

    const candidate =
      userWithImage?.profileImageUrl ??
      userWithImage?.avatarUrl ??
      userWithImage?.imageUrl ??
      '';

    if (candidate.trim().length > 0) {
      return candidate;
    }

    const name = `${this.firstName} ${this.lastName}`.trim() || this.user?.email || 'Usuario';
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&size=128&background=1a1a1a&color=ffffff&bold=true`;
  }

  onProfileImageError(): void {
    this.profileImageError = true;
  }

  confirmarSaldo(): void {
    const cantidad = Number(this.cantidadInput) || 0;
    if (cantidad <= 0) {
      this.message = 'La cantidad debe ser mayor a 0.';
      return;
    }

    if (this.metodoSaldo === 'paypal') {
      if (!this.isValidEmail(this.paypalEmail)) {
        this.message = 'Introduce un email valido de PayPal.';
        return;
      }
    }

    if (this.metodoSaldo === 'tarjeta') {
      const cardNumberDigits = this.cardNumber.replaceAll(' ', '');
      if (!/^\d{16}$/.test(cardNumberDigits)) {
        this.message = 'El numero de tarjeta debe tener 16 digitos.';
        return;
      }

      if (this.cardName.trim().length < 3) {
        this.message = 'Introduce el nombre del titular de la tarjeta.';
        return;
      }

      if (!this.isValidExpiry(this.cardExpiry)) {
        this.message = 'La fecha de caducidad debe tener formato MM/AA y no estar vencida.';
        return;
      }

      if (!/^\d{3,4}$/.test(this.cardCvv)) {
        this.message = 'El CVV debe tener 3 o 4 digitos.';
        return;
      }
    }

    this.saldo += cantidad;
    sessionStorage.setItem('saldo', this.saldo.toFixed(2));
    this.message =
      this.metodoSaldo === 'paypal'
        ? `Se agregaron ${cantidad.toFixed(2)} EUR con PayPal.`
        : `Se agregaron ${cantidad.toFixed(2)} EUR con tarjeta.`;
    this.cerrarDialogoSaldo();
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  private isValidExpiry(value: string): boolean {
    const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;
    const match = expiryRegex.exec(value.trim());
    if (!match) {
      return false;
    }

    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const now = new Date();
    const expiry = new Date(year, month);
    return expiry > new Date(now.getFullYear(), now.getMonth());
  }

  private getCurrentFormValues() { 
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      street: this.street,
      streetNumber: this.streetNumber,
      apartment: this.apartment,
      city: this.city,
      province: this.province,
      postalCode: this.postalCode,
      additionalInfo: this.additionalInfo,
      coordinates: this.coordinates,
      nearestWarehouseName: this.nearestWarehouseName,
      nearestWarehouseDistanceKm: this.nearestWarehouseDistanceKm,
    };
  }

  onPostalCodeChange(value: string): void {
    this.postalCode = value;

    if (this.postalCodeTimer) {
      clearTimeout(this.postalCodeTimer);
      this.postalCodeTimer = null;
    }

    const normalizedPostalCode = value.replaceAll(/\s+/g, '').trim();
    if (normalizedPostalCode.length < 5) {
      this.isResolvingPostalCode = false;
      this.coordinates = null;
      this.nearestWarehouseName = '';
      this.nearestWarehouseDistanceKm = null;
      return;
    }

    this.isResolvingPostalCode = true;
    this.postalCodeTimer = setTimeout(() => {
      void this.resolveCoordinatesByPostalCode(normalizedPostalCode, true);
    }, 450);
  }

  private async resolveCoordinatesByPostalCode(
    postalCodeValue: string,
    updateNearest = false,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const resolved = await this.addressGeoService.geocodeFromPostalCode(postalCodeValue);

    if (!resolved) {
      this.isResolvingPostalCode = false;
      return null;
    }

    if (!this.city.trim() && resolved.city.trim()) {
      this.city = resolved.city;
    }
    if (!this.province.trim() && resolved.province.trim()) {
      this.province = resolved.province;
    }
    if (!this.street.trim() && resolved.street.trim()) {
      this.street = resolved.street;
    }
    if (!this.streetNumber.trim() && resolved.streetNumber.trim()) {
      this.streetNumber = resolved.streetNumber;
    }

    const coordinates = {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    };

    this.coordinates = coordinates;

    if (updateNearest) {
      await this.updateNearestWarehouse(coordinates.latitude, coordinates.longitude);
    }

    this.isResolvingPostalCode = false;
    return coordinates;
  }

  private async updateNearestWarehouse(latitude: number, longitude: number): Promise<void> {
    const nearest = await this.addressGeoService.getNearestWarehouse(latitude, longitude);
    if (!nearest) {
      this.nearestWarehouseName = '';
      this.nearestWarehouseDistanceKm = null;
      return;
    }

    this.nearestWarehouseName = nearest.warehouse.name;
    this.nearestWarehouseDistanceKm = nearest.distanceKm;
  }
}
