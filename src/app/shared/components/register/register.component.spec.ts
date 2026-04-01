import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { AuthStore } from '../../../core/auth.store';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: ApiService,
          useValue: {
            signup: () => of({ token: '', type: 'Bearer', id: 1, email: '', firstName: '', lastName: '', roles: [] }),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            setSession: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
