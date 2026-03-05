import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent {
  // HARDCODEADO
  pedidos = [
    { id: 'ID Pedido', estado: 'Estado', fecha: 'Fecha', total: 'x€' },
    { id: 'ID Pedido', estado: 'Estado', fecha: 'Fecha', total: 'x€' },
    { id: 'ID Pedido', estado: 'Estado', fecha: 'Fecha', total: 'x€' },
    { id: 'ID Pedido', estado: 'Estado', fecha: 'Fecha', total: 'x€' },
    { id: 'ID Pedido', estado: 'Estado', fecha: 'Fecha', total: 'x€' },
  ];
  // /HARDCODEADO

  // HARDCODEADO
  detalleProductos = [
    { nombre: 'Nombre', cantidad: 'Cantidad', precioPeso: 'Precio/Peso' },
    { nombre: 'Nombre', cantidad: 'Cantidad', precioPeso: 'Precio/Peso' },
    { nombre: 'Nombre', cantidad: 'Cantidad', precioPeso: 'Precio/Peso' },
  ];
  // /HARDCODEADO

  pedidoSeleccionado: any = null;
  dialogVisible = false;

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

  verDetalles(pedido: any): void {
    this.pedidoSeleccionado = pedido;
    this.dialogVisible = true;
  }

  cerrarDialog(): void {
    this.dialogVisible = false;
    this.pedidoSeleccionado = null;
    window.location.reload();
  }

  cancelarPedido(): void {
    // implementar lógica de cancelación
    this.cerrarDialog();
  }
}
