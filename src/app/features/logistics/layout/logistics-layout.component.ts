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
export class LogisticsLayoutComponent {
  constructor(
    private readonly router: Router,
    private readonly authStore: AuthStore,
  ) {}

  goToOrders(): void {
    this.router.navigate(['/logistics/orders']);
  }

  goToProducts(): void {
    this.router.navigate(['/logistics/products']);
  }

  logout(): void {
    this.authStore.clear();
    this.router.navigate(['/login']);
  }
}
