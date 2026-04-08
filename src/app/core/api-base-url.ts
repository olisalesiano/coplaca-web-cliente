import { environment } from '../../environments/environment';

declare global {
  interface Window {
    __COPLACA_API_URL__?: string;
  }
}

function sanitizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

// Resuelve la URL base de la API con prioridad:
// 1) variable runtime en window,
// 2) override guardado en localStorage,
// 3) valor de environment.
export function resolveApiBaseUrl(): string {
  const runtimeWindow = globalThis.window;
  const runtimeStorage = globalThis.localStorage;
  const runtimeUrl =
    runtimeWindow?.__COPLACA_API_URL__ ??
    runtimeStorage?.getItem('coplaca_api_url') ??
    environment.apiUrl;

  return sanitizeBaseUrl(runtimeUrl);
}
