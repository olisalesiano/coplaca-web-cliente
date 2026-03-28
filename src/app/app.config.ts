import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { JwtInterceptor } from './interceptors/jwt.interceptor';

// Registro centralizado de proveedores para la aplicacion Angular standalone.
export const appConfig: ApplicationConfig = {
  providers: [
    // Captura global de errores de navegador/runtime.
    provideBrowserGlobalErrorListeners(),
    // Configuracion del router y arbol de rutas.
    provideRouter(routes),
    // Cliente HTTP con cadena de interceptores registrada por DI.
    provideHttpClient(withInterceptorsFromDi()),
    // Interceptor JWT registrado como multi-provider.
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
};
