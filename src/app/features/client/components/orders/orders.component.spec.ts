import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
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
});
