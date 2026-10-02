import { correlationId } from '../../api/correlationId';
import type { ApiError } from './types';

/**
 * Same-origin fetch wrapper for the control-plane API.
 * - session cookie rides along (`credentials: 'same-origin'`)
 * - CSRF: XSRF-TOKEN cookie → X-XSRF-TOKEN header on mutations
 * - attaches a correlation id to every request so UI issues can be traced
 *   to backend audit entries
 */
export class ControlPlaneError extends Error {
  readonly code: string;
  readonly status: number;
  readonly correlationId?: string;

  constructor(status: number, body: ApiError) {
    super(body.message || `request failed (${status})`);
    this.status = status;
    this.code = body.code || 'UNKNOWN';
    this.correlationId = body.correlationId;
  }
}

function xsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? 'GET').toUpperCase();
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (method !== 'GET' && method !== 'HEAD') {
    const token = xsrfToken();
    if (token) headers.set('X-XSRF-TOKEN', token);
  }
  headers.set('X-Correlation-Id', correlationId());

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    let body: ApiError = {
      code: 'UNKNOWN',
      message: `request failed (${response.status})`,
    };
    try {
      body = (await response.json()) as ApiError;
    } catch {
      // non-JSON error body — keep the default
    }
    if (response.status === 401 && typeof window !== 'undefined'
        && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ControlPlaneError(response.status, body);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  qs,
};

export const API_BASE = '/api/v1/control-plane';
export const AUTH_BASE = '/api/v1/auth';

