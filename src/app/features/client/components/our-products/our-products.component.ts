import {
  Component,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../core/api.service';
import { CartStore } from '../../../../core/cart.store';
import { ProductDTO } from '../../../../core/api.models';
import { DialogComponent } from '../dlg/dialog.component';

interface DisplayOffer {
  product: ProductDTO;
  reason: string;
  discountPercentage: number;
}

interface FallbackOffer {
  reason: string;
  discountPercentage: number;
}

@Component({
  selector: 'app-our-products',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, DialogComponent],
  templateUrl: './our-products.component.html',
  styleUrls: ['./our-products.component.css'],
})
// Catalogo del cliente: filtros, ofertas, seleccion de cantidad y alta al carrito.
export class OurProductsComponent implements OnInit {
  @ViewChild('addProductDialog') addProductDialogRef?: DialogComponent;
  @ViewChild('offersGridContainer') offersGridContainer?: ElementRef<HTMLDivElement>;
  private static readonly DEFAULT_PRODUCT_IMAGE = '/assets/test/Banana.png';

  private static readonly PRODUCT_IMAGE_BY_KEYWORD: Record<string, string> = {
    banana: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg',
    platano: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg',
    manzana: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg',
    pera: 'https://upload.wikimedia.org/wikipedia/commons/0/06/Pears.jpg',
    naranja: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Orange-Fruit-Pieces.jpg',
    limon: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Lemon-Whole-Split.jpg',
    aguacate:
      'https://upload.wikimedia.org/wikipedia/commons/c/c8/Avocado_Hass_-_single_and_halved.jpg',
    tomate: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg',
    papaya: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Papaya_cross_section_BNC.jpg',
    mango: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Hapus_Mango.jpg',
    pina: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Pineapple_and_cross_section.jpg',
    melon: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Cantaloupes.jpg',
    sandia: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Watermelon_cross_BNC.jpg',
    fresa: 'https://upload.wikimedia.org/wikipedia/commons/2/29/PerfectStrawberry.jpg',
    kiwi: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Kiwi_aka.jpg',
    lechuga: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Lettuce_Mini_Romaine.jpg',
  };

  private static readonly FALLBACK_OFFER_BY_KEYWORD: Record<string, FallbackOffer> = {
    platano: { reason: 'Exceso de cosecha', discountPercentage: 15 },
    mango: { reason: 'Promocion tropical', discountPercentage: 18 },
    papaya: { reason: 'Stock de temporada', discountPercentage: 12 },
    pina: { reason: 'Venta flash de hoy', discountPercentage: 10 },
    sandia: { reason: 'Lote fresco del dia', discountPercentage: 20 },
    fresa: { reason: 'Campana de producto fresco', discountPercentage: 16 },
  };

  products: ProductDTO[] = [];
  loading = false;
  message = '';
  messageType: 'info' | 'warning' | 'error' | 'success' = 'info';
  stockNotice = '';
  searchQuery = '';
  showFilters = false;
  selectedCategory = 'Todas';
  onlyInStock = false;
  onlyOffers = false;
  onlyFresh = false;
  quantityByProduct: Record<number, number> = {};
  rotatedProductsIndex: number = 0;
  rotationInterval: number = 10000; // 10 segundos
  displayOffers: DisplayOffer[] = [];
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly apiService: ApiService,
    private readonly cartStore: CartStore,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // Inicializa rotacion visual y carga de catalogo.
  ngOnInit(): void {
    this.setupProductRotation();
    this.startProductRefresh();
    this.loadAllProducts();
  }

  // Carga catalogo completo y normaliza cantidades por producto.
  private loadAllProducts(silentRefresh = false): void {
    this.loading = true;
    if (!silentRefresh) {
      this.message = '';
    }
    this.apiService.getProducts('').subscribe({
      next: (products) => {
        this.products = products;
        this.displayOffers = this.getDisplayOffers();
        this.stockNotice = this.buildStockNotice(products);

        for (const product of products) {
          this.quantityByProduct[product.id] ??= 1;
        }

        if (products.length === 0) {
          this.setMessage('warning', 'No hay productos disponibles en este momento.');
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.setMessage('error', 'No se pudieron cargar los productos desde la API Coplaca.');
      },
    });
  }

  loadProducts(): void {
    this.rotatedProductsIndex = 0;
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadProducts();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  getCategoryFilters(): string[] {
    const categories = new Set<string>();
    for (const product of this.products) {
      if (product.categoryName && product.categoryName.trim().length > 0) {
        categories.add(product.categoryName.trim());
      }
    }

    return ['Todas', ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
  }

  setCategoryFilter(category: string): void {
    this.selectedCategory = category;
  }

  getOffers(): ProductDTO[] {
    return this.products.filter(
      (product) =>
        Boolean(product.offerReason) ||
        (product.discountPercentage !== undefined && Number(product.discountPercentage) > 0),
    );
  }

  // Construye oferta visible combinando oferta real de API con fallback local.
  getDisplayOffers(): DisplayOffer[] {
    return this.getReactiveProducts()
      .map((product) => {
        const apiDiscount = Number(product.discountPercentage ?? 0);
        if (Boolean(product.offerReason) || apiDiscount > 0) {
          return {
            product,
            reason: product.offerReason || 'Promocion temporal',
            discountPercentage: apiDiscount > 0 ? apiDiscount : 10,
          } satisfies DisplayOffer;
        }

        const fallback = this.resolveFallbackOffer(product);
        if (!fallback) {
          return null;
        }

        return {
          product,
          reason: fallback.reason,
          discountPercentage: fallback.discountPercentage,
        } satisfies DisplayOffer;
      })
      .filter((offer): offer is DisplayOffer => offer !== null)
      .slice(0, 6);
  }

  getRotatedAvailableProducts(): ProductDTO[] {
    const available = this.getReactiveProducts().filter(
      (product) => !this.getDisplayOffers().some((offer) => offer.product.id === product.id),
    );

    if (available.length === 0) {
      return [];
    }

    const itemsPerPage = 5;
    const startIdx = (this.rotatedProductsIndex * itemsPerPage) % available.length;
    const endIdx = startIdx + itemsPerPage;

    if (endIdx <= available.length) {
      return available.slice(startIdx, endIdx);
    }

    return [
      ...available.slice(startIdx),
      ...available.slice(0, Math.abs(endIdx - available.length)),
    ];
  }

  getReactiveProducts(): ProductDTO[] {
    return this.products.filter((product) => {
      const query = this.normalizeText(this.searchQuery.trim());
      if (query.length > 0) {
        const searchableText = this.normalizeText(
          `${product.name ?? ''} ${product.description ?? ''} ${product.categoryName ?? ''}`,
        );
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      if (this.selectedCategory !== 'Todas' && product.categoryName !== this.selectedCategory) {
        return false;
      }

      if (this.onlyInStock && Number(product.stockQuantity) <= 0) {
        return false;
      }

      if (this.onlyOffers && !this.hasAnyOffer(product)) {
        return false;
      }

      if (this.onlyFresh && !this.isFreshProduct(product)) {
        return false;
      }

      return true;
    });
  }

  getFreshProducts(): ProductDTO[] {
    return this.getReactiveProducts().filter((product) => this.isFreshProduct(product));
  }

  // Agrega producto al carrito con la cantidad seleccionada en kilos.
  addToCart(product: ProductDTO): void {
    const quantityKg = this.quantityByProduct[product.id] ?? 1;
    if (quantityKg <= 0) {
      this.setMessage('error', 'La cantidad por kilo debe ser mayor que 0.');
      return;
    }

    if (this.isOutOfStock(product)) {
      this.setMessage('warning', `${product.name} ya está agotado.`);
      return;
    }

    if (quantityKg > Number(product.stockQuantity)) {
      this.setMessage(
        'warning',
        `Solo hay ${product.stockQuantity} kg de ${product.name} disponibles.`,
      );
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
    this.setMessage('success', `${product.name} anadido al carrito (${quantityKg} kg).`);
  }

  openProductDialog(product: ProductDTO): void {
    this.addProductDialogRef?.open(product);
  }

  onDialogConfirm(event: { product: ProductDTO; cantidad: number }): void {
    if (!event?.product) {
      return;
    }

    this.quantityByProduct[event.product.id] = Math.max(1, Number(event.cantidad) || 1);
    this.addToCart(event.product);
  }

  goToProfile(): void {
    this.router.navigate(['/client/profile']);
  }

  goToCart(): void {
    this.router.navigate(['/client/cart']);
  }

  goToOrders(): void {
    this.router.navigate(['/client/orders']);
  }

  goToOurProducts(): void {
    this.searchQuery = '';
    this.loadProducts();
    this.router.navigate(['/client/our-products']);
  }
  private setupProductRotation(): void {
    interval(this.rotationInterval)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const available = this.getReactiveProducts();
        if (available.length > 5) {
          this.rotatedProductsIndex =
            (this.rotatedProductsIndex + 1) % Math.ceil(available.length / 5);
        }
      });
  }

  private startProductRefresh(): void {
    interval(15000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadAllProducts(true);
      });
  }

  getProductImage(product: ProductDTO): string {
    const imageFromApi = (product.imageUrl ?? '').trim();
    if (imageFromApi.length > 0) {
      return imageFromApi;
    }

    const normalizedName = this.normalizeText(product.name ?? '');
    const matchedKeyword = Object.keys(OurProductsComponent.PRODUCT_IMAGE_BY_KEYWORD).find(
      (keyword) => normalizedName.includes(keyword),
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

  private hasAnyOffer(product: ProductDTO): boolean {
    const apiDiscount = Number(product.discountPercentage ?? 0);
    if (Boolean(product.offerReason) || apiDiscount > 0) {
      return true;
    }

    return this.resolveFallbackOffer(product) !== null;
  }

  private resolveFallbackOffer(product: ProductDTO): FallbackOffer | null {
    const normalizedName = this.normalizeText(product.name ?? '');
    const matchedKeyword = Object.keys(OurProductsComponent.FALLBACK_OFFER_BY_KEYWORD).find(
      (keyword) => normalizedName.includes(keyword),
    );

    if (!matchedKeyword) {
      return null;
    }

    return OurProductsComponent.FALLBACK_OFFER_BY_KEYWORD[matchedKeyword];
  }

  private isFreshProduct(product: ProductDTO): boolean {
    const normalizedCategory = this.normalizeText(product.categoryName ?? '');
    const isFreshCategory =
      normalizedCategory.includes('fruta') ||
      normalizedCategory.includes('subtropical') ||
      normalizedCategory.includes('ortaliza');

    return isFreshCategory && Number(product.stockQuantity) >= 120;
  }

  isOutOfStock(product: ProductDTO): boolean {
    return Number(product.stockQuantity) <= 0;
  }

  private buildStockNotice(products: ProductDTO[]): string {
    const outOfStockNames = products
      .filter((product) => this.isOutOfStock(product))
      .map((product) => product.name.trim())
      .filter((name) => name.length > 0);

    if (outOfStockNames.length === 0) {
      return '';
    }

    const preview = outOfStockNames.slice(0, 3).join(', ');
    const remaining = outOfStockNames.length - 3;
    const suffix = remaining > 0 ? ` y ${remaining} mas` : '';

    return outOfStockNames.length === 1
      ? `Producto agotado: ${preview}.`
      : `Productos agotados: ${preview}${suffix}.`;
  }

  private setMessage(type: 'info' | 'warning' | 'error' | 'success', text: string): void {
    this.messageType = type;
    this.message = text;
  }

  scrollOffersLeft(): void {
    const container = this.offersGridContainer?.nativeElement;
    if (!container) {
      return;
    }

    const cardStep = container.clientWidth / 5;
    container.scrollBy({
      left: -cardStep,
      behavior: 'smooth',
    });
  }

  scrollOffersRight(): void {
    const container = this.offersGridContainer?.nativeElement;
    if (!container) {
      return;
    }

    const cardStep = container.clientWidth / 5;
    container.scrollBy({
      left: cardStep,
      behavior: 'smooth',
    });
  }
}
