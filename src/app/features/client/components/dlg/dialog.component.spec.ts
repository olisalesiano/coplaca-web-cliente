import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogComponent } from './dialog.component';

// Prueba basica del dialogo reutilizable.
describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;

  // Inicializa componente standalone para cada test.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Confirma creacion correcta del componente.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
