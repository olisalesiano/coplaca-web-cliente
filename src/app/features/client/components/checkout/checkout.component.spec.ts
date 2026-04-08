import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartStore } from '../../../../core/cart.store';

import { CheckoutComponent } from './checkout.component';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let storedItems: Array<{
    productId: number;
    name: string;
    unitPrice: number;
    stockQuantity: number;
    quantityKg: number;
  }>;

  beforeEach(async () => {
    storedItems = [];
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        {
          provide: CartStore,
          useValue: {
            getItems: () => storedItems,
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set orderSuccess to true when confirmarPedido is called', () => {
    // Setup: establecer dirección y saldo suficiente
    component.direccion = '123 Calle Principal';
    component.ciudad = 'Madrid';
    component.codigoPostal = '28001';
    component.saldoCuenta = 100;
    
    component.confirmarPedido();
    expect(component.orderSuccess).toBe(true);
  });

  it('should calculate checkout total using shared pricing rules', () => {
    storedItems = [
      { productId: 1, name: 'Platano', unitPrice: 2, stockQuantity: 10, quantityKg: 2 },
      { productId: 2, name: 'Mango', unitPrice: 3, stockQuantity: 10, quantityKg: 1 },
    ];

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;

    expect(component.subtotalNumerico).toBe(7);
    expect(component.envioNumerico).toBe(2.5);
    expect(component.totalNumerico).toBe(9.5);
  });
});