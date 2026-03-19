import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../core/cart.store';
import { ProductDTO } from '../../core/api.models';

@Component({
  selector: 'app-our-products',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './our-products.component.html',
  styleUrls: ['./our-products.component.css'],
})
export class OurProductsComponent {
  products: ProductDTO[] = [];
  searchQuery = '';
  loading = false;
  message = '';
  quantityByProduct: Record<number, number> = {};

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly cartStore: CartStore,
  ) {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.apiService.getProducts(this.searchQuery).subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message = 'No se pudieron cargar los productos.';
      },
    });
  }

  getOffers(): ProductDTO[] {
    return this.products.filter((product) => !!product.offerReason || (product.discountPercentage ?? 0) > 0);
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
