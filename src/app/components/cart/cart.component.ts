import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule, MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatIcon, MatIconModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  // HARDCODEADO
  cartItems = [
    { nombre: 'Nombre 1', cantidad: '-', precio: '-€', peso: '-kg' },
    { nombre: 'Nombre 1', cantidad: '-', precio: '-€', peso: '-kg' },
    { nombre: 'Nombre 1', cantidad: '-', precio: '-€', peso: '-kg' },
  ];

  // HARDCODEADO
  sugerencias = Array(11).fill({ nombre: 'Nombre', precio: 'Precio' });

  totalPedido = '-€';

  constructor(private router: Router) {}

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
  pagar(): void {
    /* implementar */
  }
}
