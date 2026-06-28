import { apiFetch } from './api';

export function createCheckoutSession() {
  return apiFetch<{ url: string | null; message?: string; configured?: boolean }>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
