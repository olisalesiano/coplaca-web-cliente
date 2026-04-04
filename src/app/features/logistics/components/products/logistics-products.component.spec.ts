import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { LogisticsProductsComponent } from './logistics-products.component';

// Prueba basica del catalogo de productos de logistica.
describe('LogisticsProductsComponent', () => {
  let component: LogisticsProductsComponent;
  let fixture: ComponentFixture<LogisticsProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticsProductsComponent],
      providers: [
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
                },
                {
                  id: 2,
                  name: 'Banana',
                  unit: 'kg',
                  unitPrice: 3,
                  stockQuantity: 24,
                },
              ]),
            getOffers: () => of([]),
            getProductCategories: () => of([{ id: 10, name: 'Frutas' }]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogisticsProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows stock notice for out-of-stock products', () => {
    expect(component.isOutOfStock({ id: 1, name: 'Tomate', unit: 'kg', unitPrice: 2, stockQuantity: 0 })).toBe(true);
    expect(component.stockNotice).toContain('Tomate');
    expect(component.stockNotice).toContain('Producto agotado');
  });
});