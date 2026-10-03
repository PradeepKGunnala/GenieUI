import { CP, request } from '../../api/client';
export interface Summary {
 generatedAt: string; scope: { tenantId: string; workspaceId: string };
 health: string; observabilityHealth: string; incidentsOpen: number; activeWorkflows: number; waitingApprovals: number;
 failedRunsLastHour: number; estimatedSpendTodayUsd: number;
 telemetryEventsLastHour: number; agentLatencyP95Ms: number | null;
}
export interface FleetNode { id: string; label: string; status: string; type: string }
export interface Workflow { id: string; mission_id: string; status: string; engine: string; correlation_id: string | null; created_at: string }
export interface TraceRow { correlation_id: string; last_seen: string; event_count: number }
export interface TraceEvent { event_id: string; occurred_at: string; trace_id: string | null; event_type: string; status: string; actor_id: string }
export interface Incident { id: string; title: string; severity: string; status: string; detected_at: string }
export interface Connector { id: string; name: string; provider: string; status: string; check_status: string | null; last_health_check_at: string | null }
export interface Cost { agent_id: string; model_name: string | null; runs: number; estimated_cost_usd: number }
export const operationsApi = {
 incidents: (offset: number) => request<Incident[]>(`${CP}/operations/incidents?offset=${offset}`),
 acknowledge: (id: string) => request(`${CP}/operations/incidents/${encodeURIComponent(id)}/acknowledge`, 'POST', {}),
 connectors: (offset: number) => request<Connector[]>(`${CP}/operations/connectors?offset=${offset}`),
 costs: (offset: number) => request<Cost[]>(`${CP}/operations/costs?offset=${offset}`),
 summary: () => request<Summary>(`${CP}/operations/summary`),
 agents: (offset: number) => request<FleetNode[]>(`${CP}/operations/agents?offset=${offset}`),
 workflows: (offset: number) => request<Workflow[]>(`${CP}/operations/workflows?offset=${offset}`),
 traces: (offset: number) => request<TraceRow[]>(`${CP}/operations/traces?offset=${offset}`),
 trace: (id: string, offset: number) => request<TraceEvent[]>(`${CP}/operations/traces/${encodeURIComponent(id)}?limit=50&offset=${offset}`),
 topology: () => request<{ nodes: FleetNode[]; edges: { source: string; target: string; relation: string }[] }>(`${CP}/operations/topology`),
};
