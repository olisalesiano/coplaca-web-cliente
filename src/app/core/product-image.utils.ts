import { resolveApiBaseUrl } from './api-base-url';

export const DEFAULT_PRODUCT_IMAGE = '/assets/test/Banana.png';

export function resolveProductImageUrl(imageUrl: string | null | undefined): string {
  const rawUrl = (imageUrl ?? '').trim();
  if (rawUrl.length === 0) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (/^(https?:)?\/\//i.test(rawUrl) || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (rawUrl.startsWith('/')) {
    return `${apiBaseUrl}${rawUrl}`;
  }

  return `${apiBaseUrl}/${rawUrl}`;
}
