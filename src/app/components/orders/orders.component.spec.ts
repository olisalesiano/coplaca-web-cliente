import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { OrderStore } from '../../core/order.store';

import { OrdersComponent } from './orders.component';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
