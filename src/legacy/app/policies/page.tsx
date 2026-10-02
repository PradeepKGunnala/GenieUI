'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE, ControlPlaneError } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { PolicyDetail, PolicySummary } from '@/lib/types';

const SCOPES = [
  'GLOBAL', 'MISSION', 'TASK', 'AGENT', 'TOOL', 'ACTION_TYPE',
];
const ACTIONS = [
  'SPEND', 'HTTP_REQUEST', 'TOOL_EXECUTION', 'MODEL_CALL',
  'DEPLOY', 'DATA_EXPORT', 'AGENT_DISPATCH', 'OTHER',
];
const EFFECTS = ['ALLOW', 'DENY', 'REQUIRE_APPROVAL', 'LIMIT'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

export default function PoliciesPage() {
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', scope: 'GLOBAL', scopeRef: '',
    actionType: 'TOOL_EXECUTION', effect: 'DENY', priority: 'NORMAL',
    conditions: '{}',
  });

  const policies = useQuery<PolicySummary[]>({
    queryKey: ['policies'],
    queryFn: () => api.get<PolicySummary[]>(`${API_BASE}/policies`),
    refetchInterval: 10_000,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<PolicyDetail>(`${API_BASE}/policies`, {
        name: form.name,
        description: form.description || undefined,
        scope: form.scope,
        scopeRef: form.scope === 'GLOBAL' ? '' : form.scopeRef,
        actionType: form.actionType,
        effect: form.effect,
        priority: form.priority,
        conditions: JSON.parse(form.conditions || '{}'),
      }),
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
  });

  const toggle = useMutation({
    mutationFn: (p: PolicySummary) =>
      api.post(
        `${API_BASE}/policies/${p.policyId}/${p.enabled ? 'disable' : 'enable'}`),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });

  const [definitionError, setDefinitionError] = useState('');
  const err = (create.error ?? toggle.error) as ControlPlaneError | null;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Policies</h1>
        {isOwner && (
          <button type="button" className="btn btn-primary"
            onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : 'New policy'}
          </button>
        )}
      </div>

      {showForm && isOwner && (
        <form
          className="card mb-6 grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              JSON.parse(form.conditions || '{}');
              setDefinitionError('');
            } catch {
              setDefinitionError('conditions must be valid JSON');
              return;
            }
            create.mutate();
          }}
        >
          <div>
            <label className="label" htmlFor="pname">Name</label>
            <input id="pname" className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="pdesc">Description</label>
            <input id="pdesc" className="input" value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="pscope">Scope</label>
            <select id="pscope" className="input" value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              {SCOPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pref">Scope ref</label>
            <input id="pref" className="input" value={form.scopeRef}
              disabled={form.scope === 'GLOBAL'}
              onChange={(e) =>
                setForm({ ...form, scopeRef: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="paction">Action type</label>
            <select id="paction" className="input" value={form.actionType}
              onChange={(e) =>
                setForm({ ...form, actionType: e.target.value })}>
              {ACTIONS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="peffect">Effect</label>
            <select id="peffect" className="input" value={form.effect}
              onChange={(e) => setForm({ ...form, effect: e.target.value })}>
              {EFFECTS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pprio">Priority</label>
            <select id="pprio" className="input" value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="pdef">
              Conditions (JSON — stored as immutable version 1)
            </label>
            <textarea
              id="pdef" className="input font-mono" rows={4} required
              value={form.conditions}
              onChange={(e) =>
                setForm({ ...form, conditions: e.target.value })}
            />
            {definitionError && (
              <p role="alert" className="mt-1 text-xs text-red-300">
                {definitionError}
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary"
              disabled={create.isPending}>
              Create policy
            </button>
          </div>
        </form>
      )}

      {err && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {err.message}
        </p>
      )}

      <div className="card p-0">
        {policies.isPending ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <DataTable
            rows={policies.data ?? []}
            rowKey={(p) => p.policyId}
            empty="No policies defined"
            columns={[
              {
                header: 'Name',
                render: (p) => (
                  <Link href={`/policies/${p.policyId}`}>{p.name}</Link>
                ),
              },
              { header: 'Scope', render: (p) => p.scope },
              { header: 'Action', render: (p) => p.actionType },
              {
                header: 'Effect',
                render: (p) => (
                  <span className={
                    p.effect === 'DENY' ? 'text-red-300'
                    : p.effect === 'REQUIRE_APPROVAL' ? 'text-amber-300'
                    : 'text-emerald-300'}>
                    {p.effect}
                  </span>
                ),
              },
              { header: 'Priority', render: (p) => p.priority },
              { header: 'Version', render: (p) => `v${p.currentVersion}` },
              {
                header: 'Enabled',
                render: (p) => <StatusBadge status={p.enabled ? 'ENABLED' : 'DISABLED'} />,
              },
              { header: 'Created', render: (p) => fmtDate(p.createdAt) },
              ...(isOwner
                ? [{
                    header: '',
                    render: (p: PolicySummary) => (
                      <button type="button" className="btn"
                        onClick={() => toggle.mutate(p)}>
                        {p.enabled ? 'Disable' : 'Enable'}
                      </button>
                    ),
                  }]
                : []),
            ]}
          />
        )}
      </div>
    </AppShell>
  );
}

