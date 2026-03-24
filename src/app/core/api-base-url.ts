import { environment } from '../../environments/environment';

declare global {
  interface Window {
    __COPLACA_API_URL__?: string;
  }
}

function sanitizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function resolveApiBaseUrl(): string {
  const runtimeUrl =
    window.__COPLACA_API_URL__ ??
    localStorage.getItem('coplaca_api_url') ??
    environment.apiUrl;

  return sanitizeBaseUrl(runtimeUrl);
}
