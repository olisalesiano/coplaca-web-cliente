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
});
