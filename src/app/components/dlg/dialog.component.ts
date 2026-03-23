import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartStore } from '../cart/cart-store/cart-store.component';

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
<<<<<<< HEAD
    this.confirmed.emit({
      product: this.product,
      cantidad: this.cantidad,
    });
=======
    if (this.product) {
      this.cartStore.addItem(this.product, this.cantidad);
    }
>>>>>>> 14918f291afa8f44ca1ab967cabfce6225084b07
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
