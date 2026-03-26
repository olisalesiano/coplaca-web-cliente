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
  orderItems = [
    { nombre: 'Plátano de Canarias', cantidad: 3, precio: '4,50€', peso: '2kg' },
    { nombre: 'Mango Extra', cantidad: 1, precio: '3,20€', peso: '0,8kg' },
    { nombre: 'Aguacate Premium', cantidad: 2, precio: '2,80€', peso: '0,6kg' },
  ];

  subtotal = '10,50€';
  envio = '2,50€';
  totalPedido = '13,00€';
  totalNumerico = 13.00;

  saldoCuenta: number = Number(sessionStorage.getItem('saldo') ?? '0');

  editandoDireccion = false;
  direccion = sessionStorage.getItem('direccion') ?? '';
  ciudad = sessionStorage.getItem('ciudad') ?? '';
  codigoPostal = sessionStorage.getItem('codigoPostal') ?? '';
  direccionTemp = '';
  ciudadTemp = '';
  codigoPostalTemp = '';

  errorDireccion = false;
  errorSaldo = false;

  orderSuccess = false;

  get saldoSuficiente(): boolean {
    return this.saldoCuenta >= this.totalNumerico;
  }

  get direccionCompleta(): boolean {
    return this.direccion.trim() !== '' &&
           this.ciudad.trim() !== '' &&
           this.codigoPostal.trim() !== '';
  }

  editarDireccion(): void {
    if (!this.editandoDireccion) {
      this.direccionTemp = this.direccion;
      this.ciudadTemp = this.ciudad;
      this.codigoPostalTemp = this.codigoPostal;
      this.editandoDireccion = true;
      this.errorDireccion = false;
    } else {
      this.direccion = this.direccionTemp;
      this.ciudad = this.ciudadTemp;
      this.codigoPostal = this.codigoPostalTemp;
      sessionStorage.setItem('direccion', this.direccion);
      sessionStorage.setItem('ciudad', this.ciudad);
      sessionStorage.setItem('codigoPostal', this.codigoPostal);
      this.editandoDireccion = false;
      this.errorDireccion = !this.direccionCompleta;
    }
  }

  confirmarPedido(): void {
    this.errorDireccion = !this.direccionCompleta;
    this.errorSaldo = !this.saldoSuficiente;

    if (this.errorDireccion || this.errorSaldo) return;

    this.saldoCuenta -= this.totalNumerico;
    sessionStorage.setItem('saldo', this.saldoCuenta.toString());
    this.orderSuccess = true;
  }

  constructor(private router: Router) {}

  goToOurProducts(): void { this.router.navigate(['/client/our-products']); }
  goToOrders(): void { this.router.navigate(['/client/orders']); }
  goToCart(): void { this.router.navigate(['/client/cart']); }
  goToProfile(): void { this.router.navigate(['/client/profile']); }
  goToHome(): void { this.router.navigate(['/client/our-products']); }
}