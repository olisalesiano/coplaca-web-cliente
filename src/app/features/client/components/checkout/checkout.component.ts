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
// Checkout simulado: resumen de compra, direccion, validacion de saldo y confirmacion.
export class CheckoutComponent {
  orderItems = [
    { nombre: 'Plátano de Canarias', cantidad: 3, precio: '4,50€', peso: '2kg' },
    { nombre: 'Mango Extra', cantidad: 1, precio: '3,20€', peso: '0,8kg' },
    { nombre: 'Aguacate Premium', cantidad: 2, precio: '2,80€', peso: '0,6kg' },
  ];

  subtotalNumerico = 10.5;
  envioNumerico = 2.5;

  get totalNumerico(): number {
    return this.roundMoney(this.subtotalNumerico + this.envioNumerico);
  }

  get subtotal(): string {
    return this.formatCurrency(this.subtotalNumerico);
  }

  get envio(): string {
    return this.formatCurrency(this.envioNumerico);
  }

  get totalPedido(): string {
    return this.formatCurrency(this.totalNumerico);
  }

  get subidaPorEnvio(): string {
    const percent = this.subtotalNumerico <= 0
      ? 0
      : (this.envioNumerico / this.subtotalNumerico) * 100;
    return `${percent.toFixed(1).replace('.', ',')}%`;
  }

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
  statusMessage = '';
  statusTone: 'info' | 'warning' | 'error' | 'success' = 'info';

  orderSuccess = false;

  get saldoSuficiente(): boolean {
    return this.saldoCuenta >= this.totalNumerico;
  }

  get direccionCompleta(): boolean {
    return this.direccion.trim() !== '' &&
           this.ciudad.trim() !== '' &&
           this.codigoPostal.trim() !== '';
  }

  // Alterna modo edicion de direccion y persiste datos en sessionStorage.
  editarDireccion(): void {
    if (this.editandoDireccion) {
      this.direccion = this.direccionTemp;
      this.ciudad = this.ciudadTemp;
      this.codigoPostal = this.codigoPostalTemp;
      sessionStorage.setItem('direccion', this.direccion);
      sessionStorage.setItem('ciudad', this.ciudad);
      sessionStorage.setItem('codigoPostal', this.codigoPostal);
      this.editandoDireccion = false;
      this.errorDireccion = !this.direccionCompleta;
      if (this.errorDireccion) {
        this.setStatus('warning', 'Completa direccion, ciudad y codigo postal para enviar el pedido.');
      } else {
        this.setStatus('success', 'Direccion guardada correctamente.');
      }
      return;
    }

    this.direccionTemp = this.direccion;
    this.ciudadTemp = this.ciudad;
    this.codigoPostalTemp = this.codigoPostal;
    this.editandoDireccion = true;
    this.errorDireccion = false;
    this.setStatus('info', 'Edita los datos y pulsa en "Guardar direccion" para confirmar los cambios.');
  }

  // Valida direccion/saldo y confirma el pedido localmente.
  confirmarPedido(): void {
    this.errorDireccion = !this.direccionCompleta;
    this.errorSaldo = !this.saldoSuficiente;

    if (this.errorDireccion || this.errorSaldo) {
      if (this.errorDireccion && this.errorSaldo) {
        this.setStatus('error', 'Completa la direccion y revisa tu saldo antes de confirmar el pedido.');
      } else if (this.errorDireccion) {
        this.setStatus('warning', 'Completa la direccion de envio para continuar.');
      } else {
        this.setStatus('warning', 'Saldo insuficiente. Puedes anadir saldo desde tu perfil.');
      }
      return;
    }

    this.saldoCuenta -= this.totalNumerico;
    sessionStorage.setItem('saldo', this.saldoCuenta.toString());
    this.setStatus('success', 'Pago confirmado. Tu pedido ha sido procesado correctamente.');
    this.orderSuccess = true;
  }

  constructor(private readonly router: Router) {}

  goToOurProducts(): void { this.router.navigate(['/client/our-products']); }
  goToOrders(): void { this.router.navigate(['/client/orders']); }
  goToCart(): void { this.router.navigate(['/client/cart']); }
  goToProfile(): void { this.router.navigate(['/client/profile']); }
  goToHome(): void { this.router.navigate(['/client/our-products']); }

  private setStatus(tone: 'info' | 'warning' | 'error' | 'success', message: string): void {
    this.statusTone = tone;
    this.statusMessage = message;
  }

  private formatCurrency(value: number): string {
    return `${value.toFixed(2).replace('.', ',')}€`;
  }

  private roundMoney(value: number): number {
    return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
  }
}