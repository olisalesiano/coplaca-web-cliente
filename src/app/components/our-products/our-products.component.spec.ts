import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ourProductsComponent } from './our-products.component';

describe('OurProducts', () => {
  let component: ourProductsComponent;
  let fixture: ComponentFixture<ourProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ourProductsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ourProductsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
