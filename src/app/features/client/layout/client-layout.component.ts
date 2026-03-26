import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.css'],
})
export class ClientLayoutComponent {
  constructor(public router: Router) {}

  // Navegación
  goToOurProducts(): void {
    this.router.navigate(['/client/our-products']);
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
}