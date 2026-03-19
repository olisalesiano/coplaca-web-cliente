import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  open(product: any): void {
    this.product = product;
    this.cantidad = 1;
    this.isOpen = true;
  }

  close(): void {
    this.isOpen = false;
  }

  confirm(): void {
    console.log('Añadiendo', this.cantidad, 'x', this.product?.nombre);
    // aquí conectarás con tu servicio de carrito
    this.close();
  }

  increment(): void {
    this.cantidad++;
  }

  decrement(): void {
    if (this.cantidad > 1) this.cantidad--;
  }
}
