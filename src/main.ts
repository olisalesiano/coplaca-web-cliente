import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Punto de entrada de la aplicacion: inicializa el componente raiz standalone
// junto con toda la configuracion global definida en app.config.ts.
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
