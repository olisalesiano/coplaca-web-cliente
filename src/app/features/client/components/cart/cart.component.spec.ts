import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../core/cart.store';
import { OrderStore } from '../../core/order.store';

import { CartComponent } from './cart.component';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
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
            getItems: () => [],
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
