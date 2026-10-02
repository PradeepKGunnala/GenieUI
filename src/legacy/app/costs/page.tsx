'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AppShell, MetricCard } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { api, API_BASE } from '@/lib/api';
import { fmtMoney } from '@/lib/format';
import type { CostSummary } from '@/lib/types';

const tooltipStyle = {
  backgroundColor: '#111a2e',
  border: '1px solid #22304f',
  fontSize: 12,
};

export default function CostsPage() {
  const summary = useQuery<CostSummary>({
    queryKey: ['costs'],
    queryFn: () => api.get<CostSummary>(`${API_BASE}/costs/summary`),
    refetchInterval: 15_000,
  });

  const data = summary.data;
  const byAgent = (data?.byAgent ?? [])
    .map((a) => ({ name: a.agentId, cost: a.totalCost }))
    .sort((x, y) => y.cost - x.cost)
    .slice(0, 12);
  const byModel = (data?.byModel ?? [])
    .map((m) => ({ name: m.modelName, cost: m.totalCost }));

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">Costs</h1>

      {summary.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Today" value={fmtMoney(data.spendToday)} />
            <MetricCard label="This week" value={fmtMoney(data.spendThisWeek)} />
            <MetricCard label="This month" value={fmtMoney(data.spendThisMonth)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="cost-by-agent" className="card">
              <h2 id="cost-by-agent"
                className="mb-3 text-sm font-semibold text-slate-200">
                Cost by agent (today)
              </h2>
              {byAgent.length === 0 ? (
                <p className="text-sm text-slate-500">No spend recorded</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byAgent} layout="vertical"
                    margin={{ left: 24 }}>
                    <CartesianGrid stroke="#22304f" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="#64748b" fontSize={11}
                      tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" width={110}
                      stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle}
                      formatter={(v) => [`$${v}`, 'cost']} />
                    <Bar dataKey="cost" fill="#5b8cff" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <section aria-labelledby="cost-by-model" className="card">
              <h2 id="cost-by-model"
                className="mb-3 text-sm font-semibold text-slate-200">
                Cost by model
              </h2>
              {byModel.length === 0 ? (
                <p className="text-sm text-slate-500">No spend recorded</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byModel}>
                    <CartesianGrid stroke="#22304f" strokeDasharray="3 3" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11}
                      tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle}
                      formatter={(v) => [`$${v}`, 'cost']} />
                    <Bar dataKey="cost" fill="#7c9eff" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>
          </div>

          <section aria-labelledby="cost-missions" className="card p-0">
            <h2 id="cost-missions"
              className="px-4 pt-4 text-sm font-semibold text-slate-200">
              Cost by mission
            </h2>
            <DataTable
              rows={data.byMission}
              rowKey={(m) => m.missionId}
              empty="No spend recorded"
              columns={[
                { header: 'Mission', render: (m) => m.missionId },
                { header: 'Cost', render: (m) => fmtMoney(m.totalCost) },
                { header: 'Executions', render: (m) => m.executionCount },
              ]}
            />
          </section>
        </div>
      )}
    </AppShell>
  );
}

