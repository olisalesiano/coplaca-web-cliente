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
  private static readonly DEFAULT_PRODUCT_IMAGE = '/assets/test/Banana.png';

  private static readonly PRODUCT_IMAGE_BY_KEYWORD: Record<string, string> = {
    banana:
      'https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg',
    platano:
      'https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg',
    manzana:
      'https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg',
    pera:
      'https://upload.wikimedia.org/wikipedia/commons/0/06/Pears.jpg',
    naranja:
      'https://upload.wikimedia.org/wikipedia/commons/c/c4/Orange-Fruit-Pieces.jpg',
    limon:
      'https://upload.wikimedia.org/wikipedia/commons/c/c1/Lemon-Whole-Split.jpg',
    aguacate:
      'https://upload.wikimedia.org/wikipedia/commons/c/c8/Avocado_Hass_-_single_and_halved.jpg',
    tomate:
      'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg',
    papaya:
      'https://upload.wikimedia.org/wikipedia/commons/5/50/Papaya_cross_section_BNC.jpg',
    mango:
      'https://upload.wikimedia.org/wikipedia/commons/9/90/Hapus_Mango.jpg',
    pina:
      'https://upload.wikimedia.org/wikipedia/commons/c/cb/Pineapple_and_cross_section.jpg',
    melon:
      'https://upload.wikimedia.org/wikipedia/commons/2/28/Cantaloupes.jpg',
    sandia:
      'https://upload.wikimedia.org/wikipedia/commons/f/fb/Watermelon_cross_BNC.jpg',
  };

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
      imageUrl: this.getProductImage(product),
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

  getProductImage(product: ProductDTO): string {
    const imageFromApi = (product.imageUrl ?? '').trim();
    if (imageFromApi.length > 0) {
      return imageFromApi;
    }

    const normalizedName = this.normalizeText(product.name ?? '');
    const matchedKeyword = Object.keys(OurProductsComponent.PRODUCT_IMAGE_BY_KEYWORD).find((keyword) =>
      normalizedName.includes(keyword),
    );

    if (matchedKeyword) {
      return OurProductsComponent.PRODUCT_IMAGE_BY_KEYWORD[matchedKeyword];
    }

    return OurProductsComponent.DEFAULT_PRODUCT_IMAGE;
  }

  onProductImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (!target) {
      return;
    }

    target.src = OurProductsComponent.DEFAULT_PRODUCT_IMAGE;
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
