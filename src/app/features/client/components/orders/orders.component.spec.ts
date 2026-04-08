import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { OrderDTO } from '../../../../core/api.models';
import { OrderStore } from '../../../../core/order.store';

import { OrdersComponent } from './orders.component';

// Pruebas basicas del historial de pedidos del cliente.
describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

  // Prepara mocks de API y almacenamiento local de pedidos.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            getMyOrders: () => of([]),
            getProducts: () => of([]),
            cancelOrder: () => of(void 0),
          },
        },
        {
          provide: OrderStore,
          useValue: {
            getOrders: () => [],
            mergeWithStored: (orders: OrderDTO[]) => orders,
            saveOrders: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Verifica instanciacion del componente.
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows only delivered orders in history view', () => {
    const makeOrder = (id: number, status: string): OrderDTO => ({
      id,
      orderNumber: `ORD-${id}`,
      status,
      totalPrice: 10,
      items: [],
    });

    component.pedidos = [
      makeOrder(1, 'PENDING'),
      makeOrder(2, 'DELIVERED'),
      makeOrder(3, 'CANCELLED'),
      makeOrder(4, ' delivered '),
    ];
    component.showHistory();

    expect(component.displayedOrders.map((o) => o.id)).toEqual([2, 4]);
  });

  it('computes order total as subtotal plus shipping', () => {
    const order: OrderDTO = {
      id: 10,
      orderNumber: 'ORD-10',
      status: 'DELIVERED',
      totalPrice: 12.5,
      items: [
        { id: 1, productId: 1, productName: 'Platano', quantity: 2, unitPrice: 4, subtotal: 8 },
        { id: 2, productId: 2, productName: 'Mango', quantity: 1, unitPrice: 2, subtotal: 2 },
      ],
    };

    expect(component.getOrderSubtotal(order)).toBe(10);
    expect(component.getOrderDeliveryFee(order)).toBe(2.5);
    expect(component.getOrderTotal(order)).toBe(12.5);
  });

  it('allows cancellation only before delivery period', () => {
    const pendingOrder: OrderDTO = {
      id: 11,
      orderNumber: 'ORD-11',
      status: 'PENDING',
      totalPrice: 0,
      items: [],
    };
    const confirmedOrder: OrderDTO = {
      id: 12,
      orderNumber: 'ORD-12',
      status: 'CONFIRMED',
      totalPrice: 0,
      items: [],
    };
    const inTransitOrder: OrderDTO = {
      id: 13,
      orderNumber: 'ORD-13',
      status: 'IN_TRANSIT',
      totalPrice: 0,
      items: [],
    };

    expect(component.canCancelOrder(pendingOrder)).toBe(true);
    expect(component.canCancelOrder(confirmedOrder)).toBe(true);
    expect(component.canCancelOrder(inTransitOrder)).toBe(false);
  });
});
