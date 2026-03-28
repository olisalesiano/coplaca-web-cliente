import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../../core/auth.store';

@Component({
  selector: 'app-logistics-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './logistics-layout.component.html',
  styleUrls: ['./logistics-layout.component.css'],
})
// Layout principal de logistica: menu operativo y navegacion entre modulos.
export class LogisticsLayoutComponent {
  constructor(
    private readonly router: Router,
    private readonly authStore: AuthStore,
  ) {}

  // Nombre mostrado en cabecera para usuario logistico autenticado.
  get logisticsDisplayName(): string {
    const session = this.authStore.getSession();
    if (!session) {
      return 'Logistica';
    }

    const fullName = `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim();
    return fullName.length > 0 ? fullName : session.email;
  }

  // Navegacion interna de los modulos logisticos.
  goToDashboard(): void {
    this.router.navigate(['/logistics/dashboard']);
  }

  goToOrders(): void {
    this.router.navigate(['/logistics/orders']);
  }

  goToProducts(): void {
    this.router.navigate(['/logistics/products']);
  }

  goToProfile(): void {
    this.router.navigate(['/logistics/profile']);
  }

  logout(): void {
    this.authStore.clear();
    this.router.navigate(['/login']);
  }
}
