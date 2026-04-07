import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { CartStore } from '../../../../core/cart.store';
import { OrderStore } from '../../../../core/order.store';

import { CartComponent } from './cart.component';

// Pruebas minimas de creacion del componente carrito.
describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let storedItems: Array<{
    productId: number;
    name: string;
    unitPrice: number;
    stockQuantity: number;
    quantityKg: number;
  }>;

  // Registra mocks de servicios usados en inicializacion del carrito.
  beforeEach(async () => {
    storedItems = [];
    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            createOrder: () => of({}),
          },
        },
        {
          provide: CartStore,
          useValue: {
            getItems: () => storedItems,
            saveItems: () => undefined,
            clear: () => undefined,
          },
        },
        {
          provide: OrderStore,
          useValue: {
            prependOrder: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Verifica que el componente se instancie sin errores.
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calculates total as products subtotal plus shipping', () => {
    storedItems = [
      { productId: 1, name: 'Platano', unitPrice: 2, stockQuantity: 10, quantityKg: 2 },
      { productId: 2, name: 'Mango', unitPrice: 3, stockQuantity: 10, quantityKg: 1 },
    ];

    component.refreshCart();

    expect(component.subtotalPedido).toBe(7);
    expect(component.gastosEnvio).toBe(2.5);
    expect(component.totalPedido).toBe(9.5);
  });
});
