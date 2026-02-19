import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurProducts } from './our-products';

describe('OurProducts', () => {
  let component: OurProducts;
  let fixture: ComponentFixture<OurProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurProducts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
