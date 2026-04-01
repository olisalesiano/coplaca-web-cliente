import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';

import { ProfileComponent } from './profile.component';

// Prueba basica del componente de perfil cliente.
describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  // Simula API y store de autenticacion para levantar el perfil.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            getCurrentUser: () =>
              of({
                id: 1,
                email: 'user@test.com',
                firstName: 'Test',
                lastName: 'User',
                enabled: true,
              }),
            updateCurrentUser: () => of({}),
            deleteCurrentUser: () => of(void 0),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            clear: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Asegura que la vista se instancie correctamente.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
