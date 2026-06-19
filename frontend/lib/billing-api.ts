import { apiFetch } from './api';

export function createCheckoutSession() {
  return apiFetch<{ url: string; message?: string }>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
