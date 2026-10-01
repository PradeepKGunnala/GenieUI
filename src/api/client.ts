import { invoke, isTauri } from '@tauri-apps/api/core';
import type { Agent, AgentDetail, Approval, AuditEvent, Autonomy, BudgetOverview, ChangeEvent, CostSummary, EmergencyStop, Health, Me, MemorySearch, Mission, MissionDetail, Overview, Page, TaskGraph } from '../types';

export const CP = '/api/v1/control-plane';

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly correlationId?: string) {
    super(message);
  }
}

function csrfToken() {
  const cookie = document.cookie.split('; ').find((part) => part.startsWith('XSRF-TOKEN='));
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : null;
}

export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  if (isTauri()) {
    const response = await invoke<{ status: number; body: string }>('api_request', { path, method, body }).catch((error: unknown) => {
      throw new ApiError(0, String(error));
    });
    if (response.status >= 400) {
      let detail: { message?: string; correlationId?: string } = {};
      try { detail = JSON.parse(response.body); } catch { detail = {}; }
      throw new ApiError(response.status, detail.message || `Request failed (${response.status})`, detail.correlationId);
    }
    return response.body ? JSON.parse(response.body) as T : undefined as T;
  }
  const headers = new Headers({ 'X-Correlation-Id': `ui-${crypto.randomUUID()}` });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (method !== 'GET') {
    const token = csrfToken();
    if (token) headers.set('X-XSRF-TOKEN', token);
  }
  const response = await fetch(path, { method, credentials: 'same-origin', headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string; correlationId?: string };
    throw new ApiError(response.status, error.message || `Request failed (${response.status})`, error.correlationId);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<Me>('/api/v1/auth/me'),
  login: (username: string, password: string) => request<Me>('/api/v1/auth/login', 'POST', { username, password }),
  logout: () => request<{ status: string }>('/api/v1/auth/logout', 'POST'),
  overview: () => request<Overview>(`${CP}/overview`),
  missions: (q = '') => request<Page<Mission>>(`${CP}/missions?${new URLSearchParams({ q, size: '50' })}`),
  mission: (id: string) => request<MissionDetail>(`${CP}/missions/${encodeURIComponent(id)}`),
  graph: (id: string) => request<TaskGraph>(`${CP}/missions/${encodeURIComponent(id)}/graph`),
  createMission: (objective: string) => request<{ missionId: string }>(`${CP}/missions`, 'POST', { objective, title: objective.slice(0, 100) }),
  startMission: (id: string) => request<{ workflowId: string }>(`${CP}/missions/${encodeURIComponent(id)}/start`, 'POST'),
  agents: () => request<Agent[]>(`${CP}/agents`),
  agent: (id: string) => request<AgentDetail>(`${CP}/agents/${encodeURIComponent(id)}`),
  setAgent: (id: string, enabled: boolean, reason: string) => request(`${CP}/agents/${encodeURIComponent(id)}/status`, 'POST', { enabled, reason }),
  approvals: () => request<Page<Approval>>(`${CP}/approvals?status=PENDING&size=50`),
  decide: (id: string, decision: 'approve' | 'deny', comment: string) => request(`${CP}/approvals/${encodeURIComponent(id)}/${decision}`, 'POST', { comment }),
  budgets: () => request<BudgetOverview>(`${CP}/budgets/summary`),
  costs: () => request<CostSummary>(`${CP}/costs/summary`),
  memory: (q: string) => request<MemorySearch>(`${CP}/memory/search?${new URLSearchParams({ q })}`),
  audit: (missionId?: string) => request<Page<AuditEvent>>(`${CP}/audit?${new URLSearchParams({ size: '50', ...(missionId ? { missionId } : {}) })}`),
  autonomy: () => request<Autonomy>(`${CP}/autonomy`),
  stop: () => request<EmergencyStop>(`${CP}/emergency-stop`),
  activateStop: (reason: string) => request<EmergencyStop>(`${CP}/emergency-stop/activate`, 'POST', { reason }),
  clearStop: (reason: string) => request<EmergencyStop>(`${CP}/emergency-stop/clear`, 'POST', { reason }),
  health: () => request<Health>(`${CP}/health`),
};

export function parseChangeEvent(raw: string): ChangeEvent | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string') {
      return value as ChangeEvent;
    }
  } catch {
    return null;
  }
  return null;
}
