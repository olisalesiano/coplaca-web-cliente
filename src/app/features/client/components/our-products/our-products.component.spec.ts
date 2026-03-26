import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CartStore } from '../../core/cart.store';

import { OurProductsComponent } from './our-products.component';

describe('OurProducts', () => {
  let component: OurProductsComponent;
  let fixture: ComponentFixture<OurProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurProductsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            getProducts: () => of([]),
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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
