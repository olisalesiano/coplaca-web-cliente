import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutComponent } from './checkout.component';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent]
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
});