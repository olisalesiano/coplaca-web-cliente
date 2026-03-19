import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-our-products',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './our-products.component.html',
  styleUrls: ['./our-products.component.css'],
})
export class ourProductsComponent {
  ofertasIndex = 0;
  temporadaIndex = 0;

  ofertas = Array(10).fill({
    nombre: 'Nombre',
    precio: 'Precio',
    descuento: 'Precio con descuento',
  });
  temporada = Array(10).fill({ nombre: 'Nombre', precio: 'Precio' });

  visibles = 6;

  constructor(private router: Router) {}

  prevOfertas(): void {
    if (this.ofertasIndex > 0) this.ofertasIndex--;
  }

  nextOfertas(): void {
    if (this.ofertasIndex < this.ofertas.length - this.visibles) this.ofertasIndex++;
  }

  addToCart(product: ProductDTO): void {
    const quantityKg = this.quantityByProduct[product.id] ?? 1;
    if (quantityKg <= 0) {
      this.message = 'La cantidad por kilo debe ser mayor que 0.';
      return;
    }

    this.cartStore.addItem({
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.unitPrice),
      imageUrl: product.imageUrl,
      stockQuantity: Number(product.stockQuantity),
      quantityKg,
      offerReason: product.offerReason,
    });
    this.message = `${product.name} anadido a la cesta (${quantityKg} kg).`;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToShop(): void {
    this.loadProducts();
  }
}
