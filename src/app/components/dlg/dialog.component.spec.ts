import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NombreDelComponente } from './dialog.component';

describe('NombreDelComponente', () => {
  let component: NombreDelComponente;
  let fixture: ComponentFixture<NombreDelComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NombreDelComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(NombreDelComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
