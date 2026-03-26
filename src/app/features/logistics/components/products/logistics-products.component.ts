import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { ProductDTO, SeasonalOfferDTO } from '../../../../core/api.models';

@Component({
  selector: 'app-logistics-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logistics-products.component.html',
  styleUrls: ['./logistics-products.component.css'],
})
export class LogisticsProductsComponent implements OnInit {
  products: ProductDTO[] = [];
  offersByProductId: Record<number, SeasonalOfferDTO> = {};
  stockByProductId: Record<number, number> = {};
  offerReasonByProductId: Record<number, string> = {};
  discountByProductId: Record<number, number> = {};
  loading = false;
  updatingStockProductId: number | null = null;
  updatingOfferProductId: number | null = null;
  error = '';
  warning = '';
  message = '';

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    this.warning = '';
    this.message = '';

    forkJoin({
      products: this.apiService.getProducts(),
      offers: this.apiService.getOffers(),
    }).subscribe({
      next: ({ products, offers }) => {
        this.products = products;
        this.offersByProductId = {};
        this.stockByProductId = {};
        this.offerReasonByProductId = {};
        this.discountByProductId = {};

        for (const offer of offers.filter((item) => item.active !== false)) {
          this.offersByProductId[offer.productId] = offer;
        }

        for (const product of products) {
          this.stockByProductId[product.id] = product.stockQuantity;
          const offer = this.offersByProductId[product.id];
          this.offerReasonByProductId[product.id] = offer?.reason ?? '';
          this.discountByProductId[product.id] = offer?.discountPercentage ?? 0;
        }

        if (products.length === 0) {
          this.warning = 'No hay productos disponibles para gestionar en este momento.';
        }

        this.loading = false;
      },
      error: (httpError: unknown) => {
        this.loading = false;
        this.error = this.extractErrorMessage(httpError, 'No se pudo cargar el catalogo de productos.');
      },
    });
  }

  updateStock(product: ProductDTO): void {
    if (this.updatingStockProductId !== null || this.updatingOfferProductId !== null) {
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
    const confirmed = confirm(`Vas a ${actionText} el stock de ${product.name} en ${Math.abs(delta)} unidades. ¿Deseas continuar?`);
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
        product.stockQuantity = requestedStockQuantity;
        this.message = `Stock actualizado para ${product.name}.`;
      },
      error: (httpError: unknown) => {
        this.updatingStockProductId = null;
        this.error = this.extractErrorMessage(httpError, 'No se pudo actualizar el stock del producto.');
      },
    });
  }

  updateOffer(product: ProductDTO): void {
    if (this.updatingStockProductId !== null || this.updatingOfferProductId !== null) {
      this.warning = 'Hay una operacion en curso. Espera a que termine.';
      return;
    }

    const offerReason = (this.offerReasonByProductId[product.id] ?? '').trim();
    const discountPercentage = Number(this.discountByProductId[product.id]);

    if (offerReason.length === 0) {
      this.error = 'Debes indicar el motivo de la oferta.';
      return;
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage > 90) {
      this.error = 'El descuento debe estar entre 1 y 90.';
      return;
    }

    if (discountPercentage > 60) {
      const approved = confirm('El descuento supera el 60%. Esta accion puede afectar margenes. ¿Deseas continuar?');
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
        this.error = this.extractErrorMessage(httpError, 'No se pudo guardar la oferta del producto.');
      },
    });
  }

  isUpdatingStock(productId: number): boolean {
    return this.updatingStockProductId === productId;
  }

  isUpdatingOffer(productId: number): boolean {
    return this.updatingOfferProductId === productId;
  }

  trackByProductId(_: number, product: ProductDTO): number {
    return product.id;
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
