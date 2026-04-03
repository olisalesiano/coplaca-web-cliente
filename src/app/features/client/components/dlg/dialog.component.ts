import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStore } from '../../../../core/cart.store';

// Dialogo reutilizable para confirmar cantidad y emitir seleccion de producto.
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
})
export class DialogComponent {
  @Input() title: string = 'Diálogo';
  isOpen: boolean = false;
  product: any = null;
  cantidad: number = 1;

  @Input() confirmLabel: string = 'Aceptar';
  @Input() cancelLabel: string = 'Cancelar';
  @Output() confirmed = new EventEmitter<{ product: any; cantidad: number }>();

  constructor(private readonly cartStore: CartStore) {}

  // Abre modal y resetea la cantidad inicial.
  open(product: any): void {
    this.product = product;
    this.cantidad = 1;
    this.isOpen = true;
  }

  // Cierra el dialogo sin confirmar.
  close(): void {
    this.isOpen = false;
  }

  // Emite seleccion confirmada al componente padre.
  confirm(): void {
    this.confirmed.emit({
      product: this.product,
      cantidad: this.cantidad,
    });
    this.close();
  }

  // Incrementa cantidad seleccionada.
  increment(): void {
    this.cantidad++;
  }

  // Decrementa sin bajar de 1 unidad.
  decrement(): void {
    if (this.cantidad > 1) this.cantidad--;
  }

  // Normaliza precio unitario desde distintos nombres de campo.
  getUnitPrice(): number {
    return Number(this.product?.unitPrice ?? this.product?.precio ?? 0);
  }

  // Obtiene etiqueta de unidad (kg por defecto).
  getUnitLabel(): string {
    const unit = String(this.product?.unit ?? 'kg').trim();
    return unit.length > 0 ? unit : 'kg';
  }

  // Calcula el total para la cantidad seleccionada.
  getTotalPrice(): number {
    return this.getUnitPrice() * this.cantidad;
  }
}
