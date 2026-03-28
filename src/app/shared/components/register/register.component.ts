import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';
import { AddressGeoService } from '../../../core/address-geo.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  // Modelo del formulario de registro y contexto de geolocalizacion.
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
  coordinates: { latitude: number; longitude: number } | null = null;
  nearestWarehouseName = '';
  nearestWarehouseDistanceKm: number | null = null;
  private postalCodeTimer: ReturnType<typeof setTimeout> | null = null;
  isResolvingPostalCode = false;

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
    private readonly addressGeoService: AddressGeoService,
  ) {}

  // Handler con debounce para codigo postal; resuelve coordenadas y almacen cercano.
  onPostalCodeChange(value: string): void {
    this.postalCode = value;

    if (this.postalCodeTimer) {
      clearTimeout(this.postalCodeTimer);
      this.postalCodeTimer = null;
    }

    const normalized = value.replaceAll(/\s+/g, '').trim();
    if (normalized.length < 5) {
      this.isResolvingPostalCode = false;
      this.coordinates = null;
      this.nearestWarehouseName = '';
      this.nearestWarehouseDistanceKm = null;
      return;
    }

    this.isResolvingPostalCode = true;
    this.postalCodeTimer = setTimeout(() => {
      void this.resolveCoordinatesFromPostalCode(normalized);
    }, 450);
  }

  // Intenta resolver coordenadas por codigo postal y completar campos faltantes.
  private async resolveCoordinatesFromPostalCode(postalCode: string): Promise<void> {
    const resolved = await this.addressGeoService.geocodeFromPostalCode(postalCode);

    if (!resolved) {
      this.isResolvingPostalCode = false;
      return;
    }

    // Rellena solo campos vacios sin pisar datos escritos manualmente.
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

    this.coordinates = {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
    };

    await this.updateNearestWarehouse(
      this.coordinates.latitude,
      this.coordinates.longitude,
    );

    this.isResolvingPostalCode = false;
  }

  // Calcula el almacen mas cercano para las coordenadas actuales.
  private async updateNearestWarehouse(
    latitude: number,
    longitude: number,
  ): Promise<void> {
    const nearest = await this.addressGeoService.getNearestWarehouse(latitude, longitude);
    if (!nearest) {
      this.nearestWarehouseName = '';
      this.nearestWarehouseDistanceKm = null;
      return;
    }

    this.nearestWarehouseName = nearest.warehouse.name;
    this.nearestWarehouseDistanceKm = nearest.distanceKm;
  }

  // Alterna visibilidad de contrasenas.
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Vuelve a la pantalla de login.
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Valida politica de contrasena y guarda incumplimientos para mostrar en UI.
  private validatePassword(): boolean {
    this.passwordErrors = [];

    // Verifica contrasena requerida
    if (!this.password?.trim()) {
      this.passwordErrors.push('La contraseña es requerida');
    }

    // Verifica confirmacion requerida
    if (!this.confirmPassword?.trim()) {
      this.passwordErrors.push('La confirmación de contraseña es requerida');
    }

    // Longitud minima
    if (this.password && this.password.length < 8) {
      this.passwordErrors.push('La contraseña debe tener al menos 8 caracteres');
    }

    // Requiere al menos una mayuscula
    if (this.password && !/[A-Z]/.test(this.password)) {
      this.passwordErrors.push('La contraseña debe contener al menos una mayúscula');
    }

    // Requiere al menos una minuscula
    if (this.password && !/[a-z]/.test(this.password)) {
      this.passwordErrors.push('La contraseña debe contener al menos una minúscula');
    }

    // Requiere al menos un numero
    if (this.password && !/\d/.test(this.password)) {
      this.passwordErrors.push('La contraseña debe contener al menos un número');
    }

    // Verifica coincidencia entre contrasena y confirmacion
    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.passwordErrors.push('Las contraseñas no coinciden');
    }

    return this.passwordErrors.length === 0;
  }

  // Valida formulario antes de abrir modal de confirmacion.
  openConfirmationModal(): void {
    // Primero valida politica de contrasena
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

    // Si todo esta correcto, abre modal
    this.showConfirmationModal = true;
  }

  // Control de cierre del modal.
  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.passwordErrors = [];
  }

  confirmRegister(): void {
    this.register();
  }

  // Flujo completo de alta: validar, geolocalizar, registrar y persistir sesion.
  async register(): Promise<void> {
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

    let resolvedCoordinates = this.coordinates;
    resolvedCoordinates ??= await this.addressGeoService.geocodeFromParts({
      street: this.street,
      streetNumber: this.streetNumber,
      city: this.city,
      province: this.province,
      postalCode: this.postalCode,
    });

    if (resolvedCoordinates === null) {
      this.error = 'No se pudo geolocalizar el domicilio. Ajusta la direccion.';
      return;
    }

    this.coordinates = resolvedCoordinates;
    await this.updateNearestWarehouse(
      resolvedCoordinates.latitude,
      resolvedCoordinates.longitude,
    );

    this.loading = true;
    this.apiService
      .signup({
        email: this.email,
        password: this.password,
        firstName: this.firstName,
        lastName: this.lastName,
        phoneNumber: this.phoneNumber,
        role: 'ROLE_CUSTOMER',
        address: {
          street: this.street,
          streetNumber: this.streetNumber,
          apartment: this.apartment,
          city: this.city,
          postalCode: this.postalCode,
          province: this.province,
          additionalInfo: this.additionalInfo,
          latitude: resolvedCoordinates.latitude,
          longitude: resolvedCoordinates.longitude,
        },
      })
      .subscribe({
        next: (session) => {
          this.authStore.setSession(session);
          this.loading = false;
          void this.router.navigate(['/client/our-products']);
        },
        error: (httpError: unknown) => {
          this.loading = false;
          this.error = this.extractErrorMessage(
            httpError,
            'No se pudo completar el registro. Revisa los datos e intenta de nuevo.',
          );
          this.showConfirmationModal = false;
        },
      });
  }

  // Convierte errores tecnicos en mensajes legibles para el registro.
  private extractErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const backendMessage = this.extractBackendMessage(error.error as { message?: string; error?: string } | string | null);
    if (backendMessage) {
      return backendMessage;
    }

    return error.status === 400
      ? 'Registro invalido. Verifica email, direccion y contraseña.'
      : fallback;
  }

  // Extrae texto de error desde payloads heterogeneos del backend.
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


