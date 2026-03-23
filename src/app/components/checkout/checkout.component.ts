import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule, MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, MatIcon, MatIconModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
})
export class CheckoutComponent {
  // HARDCODEADO - sustituir por datos reales del carrito/servicio
  orderItems = [
    { nombre: 'Plátano de Canarias', cantidad: 3, precio: '4,50€', peso: '2kg' },
    { nombre: 'Mango Extra', cantidad: 1, precio: '3,20€', peso: '0,8kg' },
    { nombre: 'Aguacate Premium', cantidad: 2, precio: '2,80€', peso: '0,6kg' },
  ];

  // datos - HARDCODADO
  saldoCuenta = '47,50€';

  subtotal = '10,50€';
  envio = '2,50€';
  totalPedido = '13,00€';


  // Dirección de envío - HARDCODEADO
  direccion = 'Calle Ejemplo 12, 3ºA';
  ciudad = 'Las Palmas de Gran Canaria';
  codigoPostal = '35001';

  orderSuccess = false;

  constructor(private router: Router) {}

  confirmarPedido(): void {
    // Implementar lógica real de pago
    this.orderSuccess = true;
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
  goToHome(): void {
    this.router.navigate(['/our-products']);
  }
}