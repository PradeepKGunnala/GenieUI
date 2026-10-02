'use client';

import { useQuery } from '@tanstack/react-query';
import Link from '@/compat/link';

import { AgentOrganization } from '@/components/AgentOrganization';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate, fmtDuration, fmtMoney, fmtPct } from '@/lib/format';
import type { AgentSummary } from '@/lib/types';

export default function AgentsPage() {
  const agents = useQuery<AgentSummary[]>({
    queryKey: ['agents'],
    queryFn: () => api.get<AgentSummary[]>(`${API_BASE}/agents`),
    refetchInterval: 8_000,
  });

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">Agents</h1>
      {agents.isError && <p role="alert" className="mb-4 text-red-300">Unable to refresh agents. {agents.data ? 'Showing the last successful snapshot.' : 'Please retry.'}</p>}
      <section className="card mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Organization live</h2>
          <span className="text-xs text-slate-400">{agents.isFetching ? 'Refreshing…' : 'Refreshes every 8 seconds'}</span>
        </div>
        <p className="mb-4 text-sm text-slate-400">CEO coordination, executive roles and specialist agents. Dashed links show role-based coordination; statuses and tasks come from the live registry.</p>
        {agents.isPending ? <p className="p-6 text-slate-400">Loading organization…</p> : <AgentOrganization agents={agents.data ?? []} />}
      </section>
      <h2 className="mb-3 font-semibold">Agent registry</h2>
      <div className="card p-0">
        {agents.isPending ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <DataTable
            rows={agents.data ?? []}
            rowKey={(a) => a.agentId}
            empty="No agents registered"
            columns={[
              {
                header: 'Agent',
                render: (a) => (
                  <Link href={`/agents/${a.agentId}`}>
                    {a.displayName}
                    <span className="ml-1 text-slate-500">({a.agentId})</span>
                  </Link>
                ),
              },
              { header: 'Role', render: (a) => a.role },
              {
                header: 'Status',
                render: (a) => <StatusBadge status={a.effectiveStatus} />,
              },
              {
                header: 'Switches',
                render: (a) => (
                  <span className="text-xs text-slate-400">
                    config {a.configEnabled ? 'on' : 'off'}
                    {a.killSwitchEngaged ? ' · kill switch' : ''}
                  </span>
                ),
              },
              {
                header: 'Current task',
                render: (a) => a.currentTaskTitle ?? '—',
              },
              { header: 'Success', render: (a) => fmtPct(a.successRate) },
              {
                header: 'Avg latency',
                render: (a) => fmtDuration(a.avgLatencyMs),
              },
              { header: 'Cost today', render: (a) => fmtMoney(a.costToday) },
              {
                header: 'Last active',
                render: (a) => fmtDate(a.lastExecutionAt),
              },
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}

