'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE, ControlPlaneError } from '@/lib/api';
import { fmtMoney } from '@/lib/format';
import type { BudgetOverview, BudgetSummary } from '@/lib/types';

const SCOPES = ['GLOBAL', 'MISSION', 'AGENT', 'TOOL', 'MODEL', 'PRODUCT'];
const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY'];

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', scope: 'GLOBAL', scopeRef: '', period: 'DAILY',
    limitAmount: '', warningThresholdPct: '80',
    hardStopThresholdPct: '100',
  });
  const [editing, setEditing] = useState<BudgetSummary | null>(null);

  const overview = useQuery<BudgetOverview>({
    queryKey: ['budgets'],
    queryFn: () => api.get<BudgetOverview>(`${API_BASE}/budgets/summary`),
    refetchInterval: 10_000,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<BudgetSummary>(`${API_BASE}/budgets`, {
        name: form.name,
        scope: form.scope,
        scopeRef: form.scope === 'GLOBAL' ? '' : form.scopeRef,
        period: form.period,
        limitAmount: Number(form.limitAmount),
        warningThresholdPct: Number(form.warningThresholdPct),
        hardStopThresholdPct: Number(form.hardStopThresholdPct),
      }),
    onSuccess: () => {
      setShowForm(false);
      setForm({ name: '', scope: 'GLOBAL', scopeRef: '', period: 'DAILY',
        limitAmount: '', warningThresholdPct: '80',
        hardStopThresholdPct: '100' });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const update = useMutation({
    mutationFn: (b: BudgetSummary) =>
      api.put<BudgetSummary>(`${API_BASE}/budgets/${b.budgetId}`, {
        version: b.version,
        name: b.name,
        limitAmount: b.limit,
        warningThresholdPct: b.warningThresholdPct,
        hardStopThresholdPct: b.hardStopThresholdPct,
        enabled: b.enabled,
      }),
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const createError = (create.error ?? update.error) as
    | ControlPlaneError | null;
  const data = overview.data;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Budgets</h1>
        {isOwner && (
          <button
            type="button" className="btn btn-primary"
            onClick={() => setShowForm((s) => !s)}
          >
            {showForm ? 'Close' : 'New budget'}
          </button>
        )}
      </div>

      {data && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {[data.dailyGlobal, data.monthlyGlobal].map((b, i) => (
            <div key={i} className="card">
              <div className="label">
                {i === 0 ? 'Daily global' : 'Monthly global'}
              </div>
              {b ? (
                <>
                  <div className="text-xl font-semibold">
                    {fmtMoney(b.committed)}{' '}
                    <span className="text-sm text-slate-400">
                      of {fmtMoney(b.limit)}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(b.utilizationPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${b.name} utilization`}
                    className="mt-2 h-2 rounded bg-ink"
                  >
                    <div
                      className={`h-2 rounded ${
                        b.status === 'EXHAUSTED' ? 'bg-red-500'
                        : b.status === 'WARNING' ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.utilizationPct)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {b.utilizationPct.toFixed(0)}% used ·{' '}
                    {fmtMoney(b.available)} available
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">Not configured</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && isOwner && (
        <form
          className="card mb-6 grid gap-3 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div>
            <label className="label" htmlFor="bname">Name</label>
            <input id="bname" className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="bscope">Scope</label>
            <select id="bscope" className="input" value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              {SCOPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bref">
              Scope ref {form.scope !== 'GLOBAL' && '(required)'}
            </label>
            <input id="bref" className="input" value={form.scopeRef}
              disabled={form.scope === 'GLOBAL'}
              required={form.scope !== 'GLOBAL'}
              placeholder="e.g. agent id, mission id"
              onChange={(e) => setForm({ ...form, scopeRef: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="bperiod">Period</label>
            <select id="bperiod" className="input" value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}>
              {PERIODS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="blimit">Limit (USD)</label>
            <input id="blimit" className="input" type="number" min="0.01"
              step="0.01" required value={form.limitAmount}
              onChange={(e) =>
                setForm({ ...form, limitAmount: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="bwarn">Warn at %</label>
            <input id="bwarn" className="input" type="number" min="1" max="100"
              required value={form.warningThresholdPct}
              onChange={(e) =>
                setForm({ ...form, warningThresholdPct: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="bhard">Hard stop at %</label>
            <input id="bhard" className="input" type="number" min="1"
              required value={form.hardStopThresholdPct}
              onChange={(e) =>
                setForm({ ...form, hardStopThresholdPct: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn btn-primary"
              disabled={create.isPending}>
              Create budget
            </button>
          </div>
        </form>
      )}

      {createError && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {createError.message}
        </p>
      )}

      <div className="card p-0">
        {overview.isPending ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <DataTable
            rows={data?.budgets ?? []}
            rowKey={(b) => b.budgetId}
            empty="No budgets configured"
            columns={[
              { header: 'Name', render: (b) => b.name },
              {
                header: 'Scope',
                render: (b) =>
                  b.scope + (b.scopeRef ? `:${b.scopeRef}` : ''),
              },
              { header: 'Period', render: (b) => b.period },
              {
                header: 'Committed / Limit',
                render: (b) => `${fmtMoney(b.committed)} / ${fmtMoney(b.limit)}`,
              },
              {
                header: 'Utilization',
                render: (b) => `${b.utilizationPct.toFixed(0)}%`,
              },
              { header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
              {
                header: 'Hard stop',
                render: (b) =>
                  b.hardStopThresholdPct == null
                    ? '—' : `${b.hardStopThresholdPct}%`,
              },
              ...(isOwner
                ? [{
                    header: '',
                    render: (b: BudgetSummary) => (
                      <button type="button" className="btn"
                        onClick={() => setEditing({ ...b })}>
                        Edit
                      </button>
                    ),
                  }]
                : []),
            ]}
          />
        )}
      </div>

      {editing && (
        <div
          role="dialog" aria-modal="true" aria-label="Edit budget"
          className="fixed inset-0 z-50 flex items-center justify-center
            bg-black/60 p-4"
        >
          <form
            className="card w-full max-w-md space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate(editing);
            }}
          >
            <h2 className="text-sm font-semibold">
              Edit {editing.name} (v{editing.version})
            </h2>
            <div>
              <label className="label" htmlFor="ename">Name</label>
              <input id="ename" className="input" required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="elimit">Limit (USD)</label>
              <input id="elimit" className="input" type="number" min="0.01"
                step="0.01" required value={editing.limit}
                onChange={(e) => setEditing({
                  ...editing, limit: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="ewarn">Warn at %</label>
              <input id="ewarn" className="input" type="number" min="1"
                max="100" required value={editing.warningThresholdPct}
                onChange={(e) => setEditing({
                  ...editing,
                  warningThresholdPct: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="ehard">Hard stop at %</label>
              <input id="ehard" className="input" type="number" min="1"
                required value={editing.hardStopThresholdPct ?? 100}
                onChange={(e) => setEditing({
                  ...editing,
                  hardStopThresholdPct: Number(e.target.value) })} />
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={editing.enabled}
                  onChange={(e) => setEditing({
                    ...editing, enabled: e.target.checked })} />
                Enabled
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn"
                onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary"
                disabled={update.isPending}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}

