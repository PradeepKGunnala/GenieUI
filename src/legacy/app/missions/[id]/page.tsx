'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useParams } from '@/compat/navigation';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { ConfirmButton } from '@/components/ConfirmButton';
import { DataTable } from '@/components/DataTable';
import { MissionGraph } from '@/components/MissionGraph';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import type {
  ApprovalSummary,
  AuditEvent,
  MissionCost,
  MissionDetail,
  Page,
  TaskGraph,
  TaskSummary,
} from '@/lib/types';

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();

  const mission = useQuery<MissionDetail>({
    queryKey: ['mission', id],
    queryFn: () => api.get<MissionDetail>(`${API_BASE}/missions/${id}`),
    refetchInterval: 5_000,
  });
  const graph = useQuery<TaskGraph>({
    queryKey: ['mission-graph', id],
    queryFn: () => api.get<TaskGraph>(`${API_BASE}/missions/${id}/graph`),
    refetchInterval: 5_000,
  });
  const approvals = useQuery<ApprovalSummary[]>({
    queryKey: ['mission-approvals', id],
    queryFn: () =>
      api.get<ApprovalSummary[]>(`${API_BASE}/missions/${id}/approvals`),
    refetchInterval: 7_500,
  });
  const audit = useQuery<Page<AuditEvent>>({
    queryKey: ['mission-audit', id],
    queryFn: () =>
      api.get<Page<AuditEvent>>(
        `${API_BASE}/missions/${id}/audit?page=0&size=50`),
    refetchInterval: 10_000,
  });
  const costs = useQuery<MissionCost[]>({
    queryKey: ['mission-costs', id],
    queryFn: () =>
      api.get<MissionCost[]>(`${API_BASE}/missions/${id}/costs`),
    refetchInterval: 15_000,
  });

  const start = useMutation({
    mutationFn: () => api.post(`${API_BASE}/missions/${id}/start`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const cancel = useMutation({
    mutationFn: () =>
      api.post<MissionDetail>(`${API_BASE}/missions/${id}/cancel`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const m = mission.data;
  const cancellable = m && !TERMINAL.has(m.status);

  return (
    <AppShell>
      <nav className="mb-3 text-sm" aria-label="Breadcrumb">
        <Link href="/missions">Missions</Link>
        <span className="text-slate-500"> / </span>
        <span className="text-slate-300">{id}</span>
      </nav>

      {mission.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {mission.isError && (
        <p role="alert" className="text-sm text-red-300">
          Mission not found or failed to load.
        </p>
      )}

      {m && (
        <div className="space-y-6">
          <div className="card flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                {m.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                {m.objective}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <StatusBadge status={m.status} />
                <span>created {fmtDate(m.createdAt)}</span>
                <span>by {m.createdBy ?? '—'}</span>
                <span>cost {fmtMoney(m.cost)}</span>
                <span>
                  {m.completedTasks}/{m.totalTasks} tasks ·{' '}
                  {m.pendingApprovals} approvals pending
                </span>
              </div>
            </div>
            {isOwner && m.status === 'CREATED' && <button type="button" className="btn btn-primary" disabled={start.isPending} onClick={() => start.mutate()}>{start.isPending ? 'Starting…' : 'Start mission'}</button>}
            {isOwner && cancellable && (
              <ConfirmButton
                label="Cancel mission"
                confirmLabel="Cancel mission"
                danger
                description={`Cancel "${m.title}"? Non-terminal tasks are cancelled too. This is audited.`}
                onConfirm={() => cancel.mutate()}
              />
            )}
          </div>
          {start.isError && <p role="alert" className="text-sm text-red-300">Unable to start mission: {start.error.message}</p>}
          {cancel.isError && (
            <p role="alert" className="text-sm text-red-300">
              Cancel failed — check audit for the correlation id.
            </p>
          )}

          <section aria-labelledby="dag">
            <h2 id="dag" className="mb-2 text-sm font-semibold text-slate-200">
              Task graph
            </h2>
            {graph.data ? (
              <MissionGraph graph={graph.data} />
            ) : (
              <div className="card text-sm text-slate-400">
                Loading graph…
              </div>
            )}
          </section>

          <section aria-labelledby="tasks">
            <h2 id="tasks" className="mb-2 text-sm font-semibold text-slate-200">
              Tasks
            </h2>
            <div className="card p-0">
              <DataTable
                rows={m.tasks}
                rowKey={(t) => t.taskId}
                columns={[
                  { header: '#', render: (t) => t.position },
                  {
                    header: 'Title',
                    render: (t: TaskSummary) => t.title,
                  },
                  {
                    header: 'Status',
                    render: (t) => <StatusBadge status={t.status} />,
                  },
                  { header: 'Agent', render: (t) => t.assignedAgentId ?? '—' },
                  { header: 'Capability', render: (t) => t.requiredCapability },
                  { header: 'Retries', render: (t) => t.retryCount },
                  {
                    header: 'Completed',
                    render: (t) => fmtDate(t.completedAt),
                  },
                ]}
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="approvals">
              <h2
                id="approvals"
                className="mb-2 text-sm font-semibold text-slate-200"
              >
                Approvals
              </h2>
              <div className="card p-0">
                <DataTable
                  rows={approvals.data ?? []}
                  rowKey={(a) => a.approvalId}
                  empty="No approvals for this mission"
                  columns={[
                    {
                      header: 'Action',
                      render: (a) => (
                        <Link href={`/approvals/${a.approvalId}`}>
                          {a.actionType}
                        </Link>
                      ),
                    },
                    {
                      header: 'Status',
                      render: (a) => <StatusBadge status={a.status} />,
                    },
                    { header: 'Risk', render: (a) => a.riskLevel ?? '—' },
                    { header: 'Requested', render: (a) => fmtDate(a.createdAt) },
                  ]}
                />
              </div>
            </section>

            <section aria-labelledby="mission-audit">
              <h2
                id="mission-audit"
                className="mb-2 text-sm font-semibold text-slate-200"
              >
                Audit trail
              </h2>
              <div className="card p-0">
                <DataTable
                  rows={audit.data?.items ?? []}
                  rowKey={(e) => e.eventId}
                  empty="No events"
                  columns={[
                    { header: 'Time', render: (e) => fmtDate(e.timestamp) },
                    { header: 'Type', render: (e) => e.eventType },
                    { header: 'Summary', render: (e) => e.summary },
                  ]}
                />
              </div>
            </section>
          </div>

          {m.finalResult && (
            <section aria-labelledby="result">
              <h2
                id="result"
                className="mb-2 text-sm font-semibold text-slate-200"
              >
                Result
              </h2>
              <div className="card whitespace-pre-wrap text-sm text-slate-300">
                {m.finalResult}
              </div>
            </section>
          )}
          {m.failureReason && (
            <section aria-labelledby="failure">
              <h2
                id="failure"
                className="mb-2 text-sm font-semibold text-red-300"
              >
                Failure reason
              </h2>
              <div className="card border-red-800 text-sm text-red-200">
                {m.failureReason}
              </div>
            </section>
          )}
          {costs.data && costs.data.length > 0 && (
            <p className="text-sm text-slate-400">
              {costs.data[0].executionCount} executions ·{' '}
              {fmtMoney(costs.data[0].totalCost)} total
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}

