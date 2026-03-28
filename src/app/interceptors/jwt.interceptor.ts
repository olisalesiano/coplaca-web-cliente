import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStore } from '../core/auth.store';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(
    private readonly authStore: AuthStore,
    private readonly router: Router,
  ) {}

  // Inserta token bearer en cada request y controla expiracion/autorizacion.
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authStore.getToken();

    // Adjunta Authorization solo cuando existe token en sesion.
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Un 401 invalida sesion local y redirige al login.
        if (error.status === 401) {
          this.authStore.clear();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
