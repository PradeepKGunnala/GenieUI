'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useParams } from '@/compat/navigation';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { ConfirmButton } from '@/components/ConfirmButton';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate, fmtDuration, fmtMoney } from '@/lib/format';
import type { AgentCost, AgentDetail, AgentExecution } from '@/lib/types';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [reason, setReason] = useState('');

  const agent = useQuery<AgentDetail>({
    queryKey: ['agent', id],
    queryFn: () => api.get<AgentDetail>(`${API_BASE}/agents/${id}`),
    refetchInterval: 8_000,
  });
  const executions = useQuery<AgentExecution[]>({
    queryKey: ['agent-executions', id],
    queryFn: () =>
      api.get<AgentExecution[]>(
        `${API_BASE}/agents/${id}/executions?limit=50`),
    refetchInterval: 10_000,
  });
  const costs = useQuery<AgentCost>({
    queryKey: ['agent-costs', id],
    queryFn: () => api.get<AgentCost>(`${API_BASE}/agents/${id}/costs`),
    refetchInterval: 15_000,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['agents'] }).then(() =>
        queryClient.invalidateQueries({ queryKey: ['agent', id] }));

  const setStatus = useMutation({
    mutationFn: (enabled: boolean) =>
      api.post(`${API_BASE}/agents/${id}/status`, { enabled, reason }),
    onSettled: invalidate,
  });
  const setKillSwitch = useMutation({
    mutationFn: (engaged: boolean) =>
      api.post(`${API_BASE}/agents/${id}/kill-switch`, { engaged, reason }),
    onSettled: invalidate,
  });

  const a = agent.data?.summary;
  const mutError = (setStatus.error ?? setKillSwitch.error) as
    | { message?: string }
    | null;

  return (
    <AppShell>
      <nav className="mb-3 text-sm" aria-label="Breadcrumb">
        <Link href="/agents">Agents</Link>
        <span className="text-slate-500"> / </span>
        <span className="text-slate-300">{id}</span>
      </nav>

      {agent.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {agent.isError && (
        <p role="alert" className="text-sm text-red-300">
          Agent not found.
        </p>
      )}

      {agent.data && a && (
        <div className="space-y-6">
          <div className="card flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                {a.displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <StatusBadge status={a.effectiveStatus} />
                <span>role {a.role}</span>
                <span>model {a.modelProfile ?? '—'}</span>
                <span>cost today {fmtMoney(a.costToday)}</span>
                <span>
                  capabilities: {a.capabilities.join(', ')}
                </span>
              </div>
              {a.currentTaskTitle && (
                <p className="mt-2 text-sm text-sky-300">
                  Running: {a.currentTaskTitle}
                </p>
              )}
              {agent.data.controlReason && (
                <p className="mt-2 text-xs text-slate-500">
                  control: {agent.data.controlReason}
                  {agent.data.controlUpdatedBy
                    ? ` (${agent.data.controlUpdatedBy})`
                    : ''}
                </p>
              )}
            </div>

            {isOwner && (
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <ConfirmButton
                    label={a.configEnabled ? 'Disable agent' : 'Enable agent'}
                    confirmLabel={a.configEnabled ? 'Disable' : 'Enable'}
                    danger={a.configEnabled}
                    description={
                      a.configEnabled
                        ? `Disable ${a.agentId}? It will receive no new assignments (running work finishes). Distinct from the kill switch.`
                        : `Re-enable ${a.agentId}? It becomes eligible for new assignments.`
                    }
                    onConfirm={() => setStatus.mutate(!a.configEnabled)}
                  />
                  <ConfirmButton
                    label={
                      a.killSwitchEngaged
                        ? 'Release kill switch'
                        : 'Engage kill switch'
                    }
                    confirmLabel={
                      a.killSwitchEngaged ? 'Release' : 'Engage kill switch'
                    }
                    danger={!a.killSwitchEngaged}
                    description={
                      a.killSwitchEngaged
                        ? `Release the kill switch on ${a.agentId}? It may be assigned work again.`
                        : `Engage the kill switch on ${a.agentId}? New dispatch is blocked immediately.`
                    }
                    onConfirm={() =>
                      setKillSwitch.mutate(!a.killSwitchEngaged)
                    }
                  />
                </div>
                <input
                  className="input w-72"
                  placeholder="reason (recorded in audit log)"
                  aria-label="Control change reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                {mutError && (
                  <p role="alert" className="text-sm text-red-300">
                    {mutError.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="card">
              <div className="label">Total cost</div>
              <div className="text-xl font-semibold">
                {fmtMoney(costs.data?.totalCost)}
              </div>
            </div>
            <div className="card">
              <div className="label">Executions</div>
              <div className="text-xl font-semibold">
                {costs.data?.executionCount ?? '—'}
              </div>
            </div>
            <div className="card">
              <div className="label">Tokens in / out</div>
              <div className="text-xl font-semibold">
                {costs.data
                  ? `${costs.data.inputTokens} / ${costs.data.outputTokens}`
                  : '—'}
              </div>
            </div>
            <div className="card">
              <div className="label">Avg cost / exec</div>
              <div className="text-xl font-semibold">
                {fmtMoney(costs.data?.averageCost)}
              </div>
            </div>
          </div>

          <section aria-labelledby="executions">
            <h2
              id="executions"
              className="mb-2 text-sm font-semibold text-slate-200"
            >
              Recent executions
            </h2>
            <div className="card p-0">
              <DataTable
                rows={executions.data ?? []}
                rowKey={(e) => e.executionId}
                empty="No executions yet"
                columns={[
                  { header: 'Started', render: (e) => fmtDate(e.startedAt) },
                  {
                    header: 'Status',
                    render: (e) => <StatusBadge status={e.status} />,
                  },
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
                  {
                    header: 'Duration',
                    render: (e) => fmtDuration(e.durationMs),
                  },
                  {
                    header: 'Cost',
                    render: (e) => fmtMoney(e.estimatedCost),
                  },
                  {
                    header: 'Error',
                    render: (e) =>
                      e.error ? (
                        <span className="text-red-300">{e.error}</span>
                      ) : (
                        '—'
                      ),
                  },
                ]}
              />
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

