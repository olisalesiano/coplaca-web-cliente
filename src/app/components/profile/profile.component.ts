import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  // saldo se guarda en la sesión para hacer testeo antes de que venga api
  saldo: number = Number(sessionStorage.getItem('saldo') ?? '0');
  dialogAbierto = false;
  cantidadInput: number | null = null;

  // Edición de perfil
  editando = false;
  nombre = sessionStorage.getItem('nombre') ?? '';
  apellidos = sessionStorage.getItem('apellidos') ?? '';
  email = sessionStorage.getItem('email') ?? '';
  ubicacion = sessionStorage.getItem('ubicacion') ?? '';

  // Temporales mientras se edita
  nombreTemp = '';
  apellidosTemp = '';
  emailTemp = '';
  ubicacionTemp = '';

  editInfo(): void {
    if (!this.editando) {
      // Abre edición copiando valores actuales a los temporales
      this.nombreTemp = this.nombre;
      this.apellidosTemp = this.apellidos;
      this.emailTemp = this.email;
      this.ubicacionTemp = this.ubicacion;
      this.editando = true;
    } else {
      // Guarda
      this.nombre = this.nombreTemp;
      this.apellidos = this.apellidosTemp;
      this.email = this.emailTemp;
      this.ubicacion = this.ubicacionTemp;
      sessionStorage.setItem('nombre', this.nombre);
      sessionStorage.setItem('apellidos', this.apellidos);
      sessionStorage.setItem('email', this.email);
      sessionStorage.setItem('ubicacion', this.ubicacion);
      this.editando = false;
    }
  }

  abrirDialogoSaldo(): void {
    this.cantidadInput = null;
    this.dialogAbierto = true;
  }

  cerrarDialogoSaldo(): void {
    this.dialogAbierto = false;
  }

  confirmarSaldo(): void {
    if (this.cantidadInput && this.cantidadInput > 0) {
      this.saldo += this.cantidadInput;
      sessionStorage.setItem('saldo', this.saldo.toString());
    }
    this.dialogAbierto = false;
  }

  constructor(private router: Router) {}

  goToShop(): void { this.router.navigate(['/our-products']); }
  goToOrders(): void { this.router.navigate(['/orders']); }
  goToCart(): void { this.router.navigate(['/cart']); }
  goToProfile(): void { this.router.navigate(['/profile']); }
  darDeBaja(): void { this.router.navigate(['/login']); }
  irAPedidos(): void { this.router.navigate(['/orders']); }
}
