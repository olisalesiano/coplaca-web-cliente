import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { ProductCategoryDTO, ProductDTO, SeasonalOfferDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-logistics-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logistics-products.component.html',
  styleUrls: ['./logistics-products.component.css'],
})
// Gestion de catalogo para logistica: stock, precio, ofertas y alta de producto.
export class LogisticsProductsComponent implements OnInit, OnDestroy {
  products: ProductDTO[] = [];
  categories: ProductCategoryDTO[] = [];
  offersByProductId: Record<number, SeasonalOfferDTO> = {};
  stockByProductId: Record<number, number> = {};
  priceByProductId: Record<number, number> = {};
  offerReasonByProductId: Record<number, string> = {};
  discountByProductId: Record<number, number> = {};
  searchTerm = '';
  selectedCategoryFilter = 'Todas';
  offerFilter: 'all' | 'with' | 'without' = 'all';
  stockFilter: 'all' | 'in' | 'low' | 'out' = 'all';
  loading = false;
  updatingStockProductId: number | null = null;
  updatingPriceProductId: number | null = null;
  updatingOfferProductId: number | null = null;
  private autoRefreshHandle: ReturnType<typeof setInterval> | null = null;
  error = '';
  warning = '';
  message = '';
  createForm = {
    name: '',
    description: '',
    unit: 'kg',
    unitPrice: 0,
    stockQuantity: 0,
    categoryId: 0,
    origin: '',
    imageUrl: '',
  };
  creatingProduct = false;
  showCreateForm = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // Carga inicial y refresco periodico de productos/ofertas/categorias.
  ngOnInit(): void {
    this.loadProducts();
    this.autoRefreshHandle = setInterval(() => {
      this.loadProducts(true);
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshHandle) {
      clearInterval(this.autoRefreshHandle);
      this.autoRefreshHandle = null;
    }
  }

  // Sincroniza datos de productos y prepara estructuras de edicion por fila.
  loadProducts(silentRefresh = false): void {
    this.loading = !silentRefresh;
    this.error = '';
    this.warning = '';
    if (!silentRefresh) {
      this.message = '';
    }

    forkJoin({
      products: this.apiService.getProducts(),
      offers: this.apiService.getOffers(),
      categories: this.apiService.getProductCategories(),
    }).subscribe({
      next: ({ products, offers, categories }) => {
        this.products = products;
        this.categories = categories;
        this.offersByProductId = {};
        this.stockByProductId = {};
        this.priceByProductId = {};
        this.offerReasonByProductId = {};
        this.discountByProductId = {};

        for (const offer of offers.filter((item) => item.active !== false)) {
          this.offersByProductId[offer.productId] = offer;
        }

        for (const product of products) {
          this.stockByProductId[product.id] = product.stockQuantity;
          this.priceByProductId[product.id] = Number(product.unitPrice);
          const offer = this.offersByProductId[product.id];
          this.offerReasonByProductId[product.id] = offer?.reason ?? '';
          this.discountByProductId[product.id] = offer?.discountPercentage ?? 0;
        }

        if (categories.length > 0 && this.createForm.categoryId <= 0) {
          this.createForm.categoryId = categories[0].id;
        }

        if (products.length === 0) {
          this.warning = 'No hay productos disponibles para gestionar en este momento.';
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(
          httpError,
          'No se pudo cargar el catalogo de productos.',
        );
      },
    });
  }

  // Crea un producto nuevo validando campos operativos minimos.
  createProduct(): void {
    if (
      this.creatingProduct ||
      this.updatingStockProductId !== null ||
      this.updatingPriceProductId !== null ||
      this.updatingOfferProductId !== null
    ) {
      this.warning = 'Hay una operacion en curso. Espera a que termine.';
      return;
    }

    const name = this.createForm.name.trim();
    const description = this.createForm.description.trim();
    const origin = this.createForm.origin.trim();
    const unitPrice = Number(this.createForm.unitPrice);
    const stockQuantity = Number(this.createForm.stockQuantity);
    const categoryId = Number(this.createForm.categoryId);

    if (name.length < 2) {
      this.error = 'El nombre del producto debe tener al menos 2 caracteres.';
      return;
    }
    if (this.createForm.unit.trim().length === 0) {
      this.error = 'La unidad es obligatoria.';
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      this.error = 'El precio debe ser mayor que cero.';
      return;
    }
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      this.error = 'El stock inicial debe ser un numero igual o mayor a cero.';
      return;
    }
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      this.error = 'Selecciona una categoria valida.';
      return;
    }

    this.creatingProduct = true;
    this.error = '';
    this.warning = '';
    this.message = '';

    this.apiService
      .createLogisticsProduct({
        name,
        description,
        unit: this.createForm.unit.trim(),
        unitPrice,
        stockQuantity,
        categoryId,
        origin,
        imageUrl: this.createForm.imageUrl.trim(),
      })
      .subscribe({
        next: () => {
          this.creatingProduct = false;
          this.message = `Producto ${name} creado correctamente.`;
          this.createForm = {
            name: '',
            description: '',
            unit: this.createForm.unit,
            unitPrice: 0,
            stockQuantity: 0,
            categoryId,
            origin: '',
            imageUrl: '',
          };
          this.showCreateForm = false;
          this.loadProducts(true);
        },
        error: (httpError: unknown) => {
          this.creatingProduct = false;
          this.error = this.extractErrorMessage(httpError, 'No se pudo crear el producto.');
        },
      });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.error = '';
    this.warning = '';
    this.message = '';
  }

  closeCreateForm(): void {
    if (this.creatingProduct) {
      return;
    }

    this.showCreateForm = false;
  }

  updateStock(product: ProductDTO): void {
    if (
      this.updatingStockProductId !== null ||
      this.updatingPriceProductId !== null ||
      this.updatingOfferProductId !== null
    ) {
      this.warning = 'Hay una operacion en curso. Espera a que termine.';
      return;
    }

    const requestedStockQuantity = Number(this.stockByProductId[product.id]);
    if (!Number.isFinite(requestedStockQuantity) || requestedStockQuantity < 0) {
      this.error = 'Stock invalido. Introduce un valor igual o mayor que cero.';
      return;
    }

    const currentStockQuantity = Number(product.stockQuantity);
    const delta = requestedStockQuantity - currentStockQuantity;
    if (delta === 0) {
      this.message = `No hay cambios de stock para ${product.name}.`;
      return;
    }

    const actionText = delta > 0 ? 'incrementar' : 'reducir';
    const confirmed = confirm(
      `Vas a ${actionText} el stock de ${product.name} en ${Math.abs(delta)} unidades. ¿Deseas continuar?`,
    );
    if (!confirmed) {
      this.warning = 'Actualizacion de stock cancelada por seguridad.';
      return;
    }

    this.updatingStockProductId = product.id;
    this.error = '';
    this.warning = '';
    this.message = '';
    this.apiService.updateLogisticsProductStock(product.id, delta).subscribe({
      next: () => {
        this.updatingStockProductId = null;
        this.message = `Stock actualizado para ${product.name}.`;
        this.loadProducts(true);
      },
      error: (httpError: unknown) => {
        this.updatingStockProductId = null;
        this.error = this.extractErrorMessage(
          httpError,
          'No se pudo actualizar el stock del producto.',
        );
      },
    });
  }

  updatePrice(product: ProductDTO): void {
    if (
      this.updatingStockProductId !== null ||
      this.updatingPriceProductId !== null ||
      this.updatingOfferProductId !== null
    ) {
      this.warning = 'Hay una operacion en curso. Espera a que termine.';
      return;
    }

    const requestedPrice = Number(this.priceByProductId[product.id]);
    if (!Number.isFinite(requestedPrice) || requestedPrice <= 0) {
      this.error = 'Precio invalido. Debe ser mayor que cero.';
      return;
    }

    const currentPrice = Number(product.unitPrice);
    if (Math.abs(requestedPrice - currentPrice) < 0.0001) {
      this.message = `No hay cambios de precio para ${product.name}.`;
      return;
    }

    const confirmed = confirm(
      `Vas a cambiar el precio de ${product.name} de ${currentPrice.toFixed(2)} EUR a ${requestedPrice.toFixed(2)} EUR. ¿Deseas continuar?`,
    );
    if (!confirmed) {
      this.warning = 'Actualizacion de precio cancelada por seguridad.';
      return;
    }

    this.updatingPriceProductId = product.id;
    this.error = '';
    this.warning = '';
    this.message = '';
    this.apiService.updateLogisticsProductPrice(product.id, requestedPrice).subscribe({
      next: () => {
        this.updatingPriceProductId = null;
        this.message = `Precio actualizado para ${product.name}.`;
        this.loadProducts(true);
      },
      error: (httpError: unknown) => {
        this.updatingPriceProductId = null;
        this.error = this.extractErrorMessage(
          httpError,
          'No se pudo actualizar el precio del producto.',
        );
      },
    });
  }

  updateOffer(product: ProductDTO): void {
    if (
      this.updatingStockProductId !== null ||
      this.updatingPriceProductId !== null ||
      this.updatingOfferProductId !== null
    ) {
      this.warning = 'Hay una operacion en curso. Espera a que termine.';
      return;
    }

    const offerReason = (this.offerReasonByProductId[product.id] ?? '').trim();
    const discountPercentage = Number(this.discountByProductId[product.id]);

    if (offerReason.length === 0) {
      this.error = 'Debes indicar el motivo de la oferta.';
      return;
    }

    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage <= 0 ||
      discountPercentage > 90
    ) {
      this.error = 'El descuento debe estar entre 1 y 90.';
      return;
    }

    if (discountPercentage > 60) {
      const approved = confirm(
        'El descuento supera el 60%. Esta accion puede afectar margenes. ¿Deseas continuar?',
      );
      if (!approved) {
        this.warning = 'Guardado de oferta cancelado por seguridad.';
        return;
      }
    }

    this.updatingOfferProductId = product.id;
    this.error = '';
    this.warning = '';
    this.message = '';
    const existingOffer = this.offersByProductId[product.id];
    const request$ = existingOffer
      ? this.apiService.updateOffer(existingOffer.id, product.id, offerReason, discountPercentage)
      : this.apiService.createOffer(product.id, offerReason, discountPercentage);

    request$.subscribe({
      next: () => {
        this.updatingOfferProductId = null;
        this.message = `Oferta guardada para ${product.name}.`;
        this.loadProducts();
      },
      error: (httpError: unknown) => {
        this.updatingOfferProductId = null;
        this.error = this.extractErrorMessage(
          httpError,
          'No se pudo guardar la oferta del producto.',
        );
      },
    });
  }

  isUpdatingStock(productId: number): boolean {
    return this.updatingStockProductId === productId;
  }

  isUpdatingPrice(productId: number): boolean {
    return this.updatingPriceProductId === productId;
  }

  isUpdatingOffer(productId: number): boolean {
    return this.updatingOfferProductId === productId;
  }

  trackByProductId(_: number, product: ProductDTO): number {
    return product.id;
  }

  getCardClasses(product: ProductDTO, index: number): Record<string, boolean> {
    const stock = Number(this.stockByProductId[product.id] ?? product.stockQuantity ?? 0);
    const hasOffer = !!this.offersByProductId[product.id];
    return {
      'tone-even': index % 2 === 0,
      'tone-odd': index % 2 !== 0,
      'has-offer': hasOffer,
      'low-stock': stock > 0 && stock < 30,
      'out-of-stock': stock <= 0,
    };
  }

  getCategoryLabel(product: ProductDTO): string {
    return product.categoryName?.trim() || 'Sin categoria';
  }

  get categoryFilters(): string[] {
    const names = this.categories
      .map((category) => category.name?.trim())
      .filter((value): value is string => Boolean(value));

    return ['Todas', ...Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))];
  }

  get filteredProducts(): ProductDTO[] {
    return this.products.filter((product) => {
      const productName = this.normalizeText(product.name ?? '');
      const productDescription = this.normalizeText(product.description ?? '');
      const productCategory = this.getCategoryLabel(product);

      if (this.searchTerm.trim().length > 0) {
        const query = this.normalizeText(this.searchTerm.trim());
        const searchable = `${productName} ${productDescription} ${this.normalizeText(productCategory)}`;
        if (!searchable.includes(query)) {
          return false;
        }
      }

      if (
        this.selectedCategoryFilter !== 'Todas' &&
        productCategory !== this.selectedCategoryFilter
      ) {
        return false;
      }

      const hasOffer = Boolean(this.offersByProductId[product.id]);
      if (this.offerFilter === 'with' && !hasOffer) {
        return false;
      }
      if (this.offerFilter === 'without' && hasOffer) {
        return false;
      }

      const stock = Number(this.stockByProductId[product.id] ?? product.stockQuantity ?? 0);
      if (this.stockFilter === 'in' && stock <= 0) {
        return false;
      }
      if (this.stockFilter === 'low' && !(stock > 0 && stock < 30)) {
        return false;
      }
      if (this.stockFilter === 'out' && stock > 0) {
        return false;
      }

      return true;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryFilter = 'Todas';
    this.offerFilter = 'all';
    this.stockFilter = 'all';
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 401) {
      return 'Sesion caducada. Inicia sesion de nuevo.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para gestionar productos u ofertas.';
    }
    if (error.status === 409) {
      return 'El recurso fue modificado por otro usuario. Recarga el listado e intenta otra vez.';
    }

    const payload = error.error as { message?: string; error?: string } | string | null;
    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload.trim();
    }
    if (payload && typeof payload === 'object') {
      const backendMessage = payload.message?.trim() || payload.error?.trim();
      if (backendMessage) {
        return backendMessage;
      }
    }

    return fallback;
  }
}
