'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useParams } from '@/compat/navigation';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE, ControlPlaneError } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { PolicyDetail, PolicyVersion } from '@/lib/types';

const ACTIONS = [
  'SPEND', 'HTTP_REQUEST', 'TOOL_EXECUTION', 'MODEL_CALL',
  'DEPLOY', 'DATA_EXPORT', 'AGENT_DISPATCH', 'OTHER',
];
const EFFECTS = ['ALLOW', 'DENY', 'REQUIRE_APPROVAL', 'LIMIT'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'];

export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [showVersion, setShowVersion] = useState(false);
  const [form, setForm] = useState({
    description: '', actionType: 'TOOL_EXECUTION', effect: 'DENY',
    priority: 'NORMAL', conditions: '{}',
  });
  const [definitionError, setDefinitionError] = useState('');

  const policy = useQuery<PolicyDetail>({
    queryKey: ['policy', id],
    queryFn: () => api.get<PolicyDetail>(`${API_BASE}/policies/${id}`),
  });
  const versions = useQuery<PolicyVersion[]>({
    queryKey: ['policy-versions', id],
    queryFn: () =>
      api.get<PolicyVersion[]>(`${API_BASE}/policies/${id}/versions`),
  });

  const addVersion = useMutation({
    mutationFn: () =>
      api.post<PolicyDetail>(`${API_BASE}/policies/${id}/versions`, {
        description: form.description || undefined,
        actionType: form.actionType,
        effect: form.effect,
        priority: form.priority,
        conditions: JSON.parse(form.conditions || '{}'),
      }),
    onSuccess: () => {
      setShowVersion(false);
      queryClient.invalidateQueries({ queryKey: ['policy', id] });
      queryClient.invalidateQueries({ queryKey: ['policy-versions', id] });
    },
  });

  const p = policy.data?.summary;
  const err = addVersion.error as ControlPlaneError | null;

  return (
    <AppShell>
      <nav className="mb-3 text-sm" aria-label="Breadcrumb">
        <Link href="/policies">Policies</Link>
        <span className="text-slate-500"> / </span>
        <span className="text-slate-300">{p?.name ?? id}</span>
      </nav>

      {policy.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {policy.isError && (
        <p role="alert" className="text-sm text-red-300">
          Policy not found.
        </p>
      )}

      {policy.data && p && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">{p.name}</h1>
              <div className="flex items-center gap-2">
                <StatusBadge status={p.enabled ? 'ENABLED' : 'DISABLED'} />
                <span className="text-xs text-slate-400">
                  v{p.currentVersion}
                </span>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
              <dt className="text-slate-400">Scope</dt><dd>{p.scope}</dd>
              <dt className="text-slate-400">Action</dt><dd>{p.actionType}</dd>
              <dt className="text-slate-400">Effect</dt><dd>{p.effect}</dd>
              <dt className="text-slate-400">Priority</dt><dd>{p.priority}</dd>
              <dt className="text-slate-400">Effective</dt>
              <dd>
                {fmtDate(p.effectiveFrom)}
                {p.effectiveTo ? ` → ${fmtDate(p.effectiveTo)}` : ''}
              </dd>
            </dl>
            <div className="mt-3">
              <div className="label">Current conditions</div>
              <pre className="overflow-x-auto rounded bg-ink p-3 text-xs">
                {JSON.stringify(policy.data.conditions, null, 2)}
              </pre>
              {policy.data.description && (
                <p className="mt-1 text-xs text-slate-500">
                  {policy.data.description}
                </p>
              )}
            </div>
            {isOwner && (
              <button
                type="button" className="btn btn-primary mt-3"
                onClick={() => setShowVersion((s) => !s)}>
                {showVersion ? 'Close' : 'New version'}
              </button>
            )}
          </div>

          {showVersion && isOwner && (
            <form
              className="card grid gap-3 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  JSON.parse(form.conditions || '{}');
                  setDefinitionError('');
                } catch {
                  setDefinitionError('conditions must be valid JSON');
                  return;
                }
                addVersion.mutate();
              }}
            >
              <p className="text-xs text-slate-400 md:col-span-2">
                A new immutable version becomes current — history is kept.
              </p>
              <div>
                <label className="label" htmlFor="vdesc">Description</label>
                <input id="vdesc" className="input" value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="vaction">Action</label>
                <select id="vaction" className="input" value={form.actionType}
                  onChange={(e) =>
                    setForm({ ...form, actionType: e.target.value })}>
                  {ACTIONS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="veffect">Effect</label>
                <select id="veffect" className="input" value={form.effect}
                  onChange={(e) =>
                    setForm({ ...form, effect: e.target.value })}>
                  {EFFECTS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="vprio">Priority</label>
                <select id="vprio" className="input" value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label" htmlFor="vdef">Conditions (JSON)</label>
                <textarea id="vdef" className="input font-mono" rows={4}
                  required value={form.conditions}
                  onChange={(e) =>
                    setForm({ ...form, conditions: e.target.value })} />
                {definitionError && (
                  <p role="alert" className="mt-1 text-xs text-red-300">
                    {definitionError}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="btn btn-primary"
                  disabled={addVersion.isPending}>
                  Publish version
                </button>
                {err && (
                  <p role="alert" className="mt-2 text-sm text-red-300">
                    {err.message}
                  </p>
                )}
              </div>
            </form>
          )}

          <section aria-labelledby="history">
            <h2 id="history"
              className="mb-2 text-sm font-semibold text-slate-200">
              Version history
            </h2>
            <div className="card p-0">
              <DataTable
                rows={versions.data ?? []}
                rowKey={(v) => v.versionId}
                empty="No versions"
                columns={[
                  { header: 'Version', render: (v) => `v${v.version}` },
                  { header: 'Recorded', render: (v) => fmtDate(v.recordedAt) },
                  { header: 'By', render: (v) => v.changedBy ?? '—' },
                  {
                    header: 'Conditions',
                    render: (v) => (
                      <code className="text-xs">
                        {JSON.stringify(v.conditions).slice(0, 80)}
                      </code>
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

