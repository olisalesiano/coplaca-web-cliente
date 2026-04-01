import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';

import { LoginComponent } from './login.component';

// Prueba de inicializacion de la pantalla de login.
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  // Inyecta mocks de login y almacenamiento de sesion.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            login: () => of({ token: '', type: 'Bearer', id: 1, email: '', firstName: '', lastName: '', roles: [] }),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            setSession: () => undefined,
            getDefaultRouteForCurrentRole: () => '/client/our-products',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Verifica creacion del componente.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
