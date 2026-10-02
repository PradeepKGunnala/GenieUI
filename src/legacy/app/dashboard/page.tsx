'use client';

import { useQuery } from '@tanstack/react-query';
import Link from '@/compat/link';

import { AppShell, MetricCard } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import type { Overview } from '@/lib/types';

export default function DashboardPage() {
  const overview = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: () => api.get<Overview>(`${API_BASE}/overview`),
    refetchInterval: 7_000, // 5–10s poll
  });

  const data = overview.data;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Overview</h1>
        {data && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">
              Autonomy: <strong>{data.autonomyMode}</strong>
            </span>
            <StatusBadge status={data.systemStatus} />
          </div>
        )}
      </div>

      {overview.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {overview.isError && (
        <p role="alert" className="text-sm text-red-300">
          Failed to load overview.
        </p>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard label="Active missions" value={data.activeMissions} />
            <MetricCard label="Running agents" value={data.runningAgents} />
            <MetricCard
              label="Pending approvals"
              value={data.pendingApprovals}
            />
            <MetricCard
              label="Spend today"
              value={fmtMoney(data.spendToday)}
              hint={
                data.dailyBudget > 0
                  ? `of ${fmtMoney(data.dailyBudget)} budget`
                  : 'no daily budget'
              }
            />
            <MetricCard
              label="Completed today"
              value={data.missionsCompletedToday}
            />
            <MetricCard
              label="Failed today"
              value={data.missionsFailedToday}
            />
            <MetricCard label="Agents idle" value={data.agentsIdle} />
            <MetricCard
              label="Agents disabled"
              value={data.agentsDisabled}
            />
          </div>

          <section aria-labelledby="urgent-approvals">
            <h2
              id="urgent-approvals"
              className="mb-2 text-sm font-semibold text-slate-200"
            >
              Pending approvals
            </h2>
            <div className="card p-0">
              <DataTable
                rows={data.urgentApprovals}
                rowKey={(a) => a.approvalId}
                empty="Nothing waiting on you"
                columns={[
                  {
                    header: 'Requested',
                    render: (a) => fmtDate(a.createdAt),
                  },
                  {
                    header: 'Action',
                    render: (a) => (
                      <Link href={`/approvals/${a.approvalId}`}>
                        {a.actionType}
                      </Link>
                    ),
                  },
                  { header: 'Agent', render: (a) => a.requestingAgent ?? '—' },
                  { header: 'Risk', render: (a) => a.riskLevel ?? '—' },
                  {
                    header: 'Est. cost',
                    render: (a) => fmtMoney(a.estimatedCost),
                  },
                  {
                    header: 'Status',
                    render: (a) => <StatusBadge status={a.status} />,
                  },
                ]}
              />
            </div>
          </section>

          <section aria-labelledby="recent-missions">
            <h2
              id="recent-missions"
              className="mb-2 text-sm font-semibold text-slate-200"
            >
              Recent missions
            </h2>
            <div className="card p-0">
              <DataTable
                rows={data.recentMissions}
                rowKey={(m) => m.missionId}
                empty="No missions yet"
                columns={[
                  {
                    header: 'Title',
                    render: (m) => (
                      <Link href={`/missions/${m.missionId}`}>
                        {m.title}
                      </Link>
                    ),
                  },
                  {
                    header: 'Status',
                    render: (m) => <StatusBadge status={m.status} />,
                  },
                  {
                    header: 'Tasks',
                    render: (m) =>
                      `${m.completedTasks}/${m.totalTasks} done`,
                  },
                  { header: 'Cost', render: (m) => fmtMoney(m.cost) },
                  {
                    header: 'Created',
                    render: (m) => fmtDate(m.createdAt),
                  },
                ]}
              />
            </div>
          </section>

          <section aria-labelledby="recent-events">
            <h2
              id="recent-events"
              className="mb-2 text-sm font-semibold text-slate-200"
            >
              Recent events
            </h2>
            <div className="card p-0">
              <DataTable
                rows={data.recentEvents}
                rowKey={(e) => e.eventId}
                empty="No events"
                columns={[
                  { header: 'Time', render: (e) => fmtDate(e.timestamp) },
                  { header: 'Type', render: (e) => e.eventType },
                  { header: 'Actor', render: (e) => e.actor || '—' },
                  { header: 'Summary', render: (e) => e.summary },
                ]}
              />
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

