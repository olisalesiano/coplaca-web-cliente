import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../core/cart.store';
import { ProductDTO } from '../../core/api.models';
import { DialogComponent } from '../dlg/dialog.component';

@Component({
  selector: 'app-our-products',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, DialogComponent],
  templateUrl: './our-products.component.html',
  styleUrls: ['./our-products.component.css'],
})
export class OurProductsComponent implements OnInit {
  products: ProductDTO[] = [];
  loading = false;
  message = '';
  searchQuery = '';
  quantityByProduct: Record<number, number> = {};

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly cartStore: CartStore,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.message = '';

    this.apiService.getProducts(this.searchQuery).subscribe({
      next: (products) => {
        this.products = products;

        for (const product of products) {
          this.quantityByProduct[product.id] ??= 1;
        }

        if (products.length === 0) {
          this.message = 'No se encontraron productos para esa busqueda.';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.products = [];
        this.message = 'No se pudieron cargar los productos desde la API Coplaca.';
      },
    });
  }

  getOffers(): ProductDTO[] {
    return this.products.filter(
      (product) =>
        Boolean(product.offerReason) ||
        (product.discountPercentage !== undefined && Number(product.discountPercentage) > 0),
    );
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
    this.message = `${product.name} anadido al carrito (${quantityKg} kg).`;
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
