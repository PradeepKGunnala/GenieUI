'use client';

import { useQuery } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { api, API_BASE } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { AuditEvent, Page } from '@/lib/types';

const TYPES = [
  '', 'AUTH_LOGIN_SUCCEEDED', 'AUTH_LOGIN_FAILED', 'AUTH_LOGOUT',
  'MISSION_CREATED', 'MISSION_PLANNING_STARTED', 'MISSION_PLAN_CREATED',
  'MISSION_COMPLETED', 'MISSION_FAILED', 'MISSION_CANCELLED',
  'MISSION_RECOVERED',
  'TASK_CREATED', 'TASK_ASSIGNED', 'AGENT_EXECUTION_STARTED',
  'AGENT_EXECUTION_COMPLETED', 'AGENT_EXECUTION_FAILED',
  'AGENT_STATUS_CHANGED', 'AGENT_ARTIFACT_PERSISTED', 'AGENT_MESSAGE_SENT',
  'NO_CAPABLE_AGENT_AVAILABLE',
  'APPROVAL_REQUESTED', 'APPROVAL_GRANTED', 'APPROVAL_DENIED',
  'APPROVAL_ESCALATED',
  'POLICY_EVALUATED', 'POLICY_CHANGED', 'POLICY_ALLOWED', 'POLICY_DENIED',
  'POLICY_APPROVAL_REQUIRED', 'POLICY_BLOCKED_ACTION',
  'POLICY_VIOLATION_DETECTED',
  'RISK_CLASSIFIED',
  'BUDGET_CHECKED', 'BUDGET_RESERVED', 'BUDGET_RESERVATION_RELEASED',
  'BUDGET_COMMITTED', 'BUDGET_EXCEEDED',
  'AUTONOMY_MODE_CHANGED',
  'GLOBAL_KILL_SWITCH_ACTIVATED', 'GLOBAL_KILL_SWITCH_CLEARED',
  'AGENT_KILL_SWITCH_ACTIVATED', 'AGENT_KILL_SWITCH_CLEARED',
  'COST_FORECAST_CREATED', 'COST_ACTUAL_RECORDED', 'COST_RECONCILED',
  'CEO_REVIEW_ACCEPTED', 'CEO_REVIEW_REJECTED',
  'CEO_REVIEW_REVISION_REQUESTED',
  'TOOL_REQUESTED', 'TOOL_EXECUTION_DENIED', 'TOOL_EXECUTION_COMPLETED',
  'TOOL_EXECUTION_FAILED',
  'COMPENSATION_EXECUTED',
  'CTO_REVIEW_STARTED', 'CTO_ARCHITECTURE_CREATED', 'CPO_PRD_CREATED',
  'ENGINEERING_PLAN_CREATED', 'CODE_CHANGE_PROPOSED',
  'QA_REVIEW_STARTED', 'QA_RELEASE_BLOCKED', 'QA_RELEASE_READY',
  'SECURITY_REVIEW_STARTED', 'SECURITY_FINDING_CREATED',
  'SECURITY_RELEASE_BLOCKED',
  'RISK_REVIEW_STARTED', 'RISK_ESCALATION_CREATED',
  'CFO_REVIEW_STARTED', 'CFO_COST_WARNING',
  'COO_READINESS_REVIEW_STARTED', 'COO_NOT_READY', 'COO_READY',
  'MARKETING_PLAN_CREATED', 'MARKETING_EXTERNAL_ACTION_REQUESTED',
  'COMPLIANCE_REVIEW_STARTED', 'COMPLIANCE_VIOLATION_FOUND',
];

export default function AuditPage() {
  const [type, setType] = useState('');
  const [agentId, setAgentId] = useState('');
  const [page, setPage] = useState(0);

  const events = useQuery<Page<AuditEvent>>({
    queryKey: ['audit', type, agentId, page],
    queryFn: () =>
      api.get<Page<AuditEvent>>(
        `${API_BASE}/audit${api.qs({
          type: type || undefined, agentId: agentId || undefined,
          page, size: 50,
        })}`,
      ),
    refetchInterval: 10_000,
  });

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">
        Audit timeline
      </h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="type">Event type</label>
          <select id="type" className="input w-64" value={type}
            onChange={(e) => { setType(e.target.value); setPage(0); }}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t || 'All'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="agent">Agent / actor</label>
          <input id="agent" className="input w-56" value={agentId}
            placeholder="e.g. research-v1"
            onChange={(e) => { setAgentId(e.target.value); setPage(0); }} />
        </div>
      </div>

      <div className="card p-0">
        {events.isPending ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <DataTable
            rows={events.data?.items ?? []}
            rowKey={(e) => e.eventId}
            empty="No events"
            columns={[
              { header: 'Time', render: (e) => fmtDate(e.timestamp) },
              { header: 'Type', render: (e) => (
                  <code className="text-xs">{e.eventType}</code>) },
              { header: 'Actor', render: (e) => e.actor || '—' },
              {
                header: 'Mission',
                render: (e) =>
                  e.missionId ? (
                    <Link href={`/missions/${e.missionId}`}>
                      {e.missionId.slice(0, 8)}…
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              { header: 'Summary', render: (e) => e.summary },
              {
                header: 'Correlation',
                render: (e) =>
                  e.correlationId ? (
                    <code className="text-xs text-slate-500">
                      {e.correlationId.slice(0, 20)}
                    </code>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        )}
      </div>

      {events.data && events.data.totalPages > 1 && (
        <nav
          aria-label="Audit pages"
          className="mt-3 flex items-center gap-2 text-sm"
        >
          <button type="button" className="btn" disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-slate-400">
            {page + 1} / {events.data.totalPages}
          </span>
          <button type="button" className="btn"
            disabled={page + 1 >= events.data.totalPages}
            onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </nav>
      )}
    </AppShell>
  );
}

