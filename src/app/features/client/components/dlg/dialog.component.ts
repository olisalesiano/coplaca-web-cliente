import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStore } from '../../../../core/cart.store';
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

  constructor(private cartStore: CartStore) {}
  open(product: any): void {
    this.product = product;
    this.cantidad = 1;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  confirm(): void {
    this.confirmed.emit({
      product: this.product,
      cantidad: this.cantidad,
    });
    this.close();
  }

  increment(): void {
    this.cantidad++;
  }

  decrement(): void {
    if (this.cantidad > 1) this.cantidad--;
  }

  getUnitPrice(): number {
    return Number(this.product?.unitPrice ?? this.product?.precio ?? 0);
  }

  getUnitLabel(): string {
    const unit = String(this.product?.unit ?? 'kg').trim();
    return unit.length > 0 ? unit : 'kg';
  }

  getTotalPrice(): number {
    return this.getUnitPrice() * this.cantidad;
  }
}
