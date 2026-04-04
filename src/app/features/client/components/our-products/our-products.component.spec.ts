import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { ProductDTO } from '../../../../core/api.models';
import { CartStore } from '../../../../core/cart.store';

import { OurProductsComponent } from './our-products.component';

// Prueba de creacion del catalogo de productos del cliente.
describe('OurProducts', () => {
  let component: OurProductsComponent;
  let fixture: ComponentFixture<OurProductsComponent>;

  // Configura dependencias minimas requeridas para renderizar el componente.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurProductsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            getProducts: () =>
              of([
                {
                  id: 1,
                  name: 'Tomate',
                  unit: 'kg',
                  unitPrice: 2,
                  stockQuantity: 0,
                } satisfies ProductDTO,
                {
                  id: 2,
                  name: 'Banana',
                  unit: 'kg',
                  unitPrice: 3,
                  stockQuantity: 12,
                } satisfies ProductDTO,
              ]),
          },
        },
        {
          provide: CartStore,
          useValue: {
            addItem: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OurProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // Valida que el componente se cree sin errores.
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a notice when products are out of stock', () => {
    expect(component.isOutOfStock({ id: 1, name: 'Tomate', unit: 'kg', unitPrice: 2, stockQuantity: 0 })).toBe(true);
    expect(component.stockNotice).toContain('Tomate');
    expect(component.stockNotice).toContain('Producto agotado');
  });
});
