'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { ConfirmButton } from '@/components/ConfirmButton';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { DeepHealth, EmergencyStop } from '@/lib/types';

export default function EmergencyPage() {
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [reason, setReason] = useState('');

  const stop = useQuery<EmergencyStop>({
    queryKey: ['emergency-stop'],
    queryFn: () => api.get<EmergencyStop>(`${API_BASE}/emergency-stop`),
    refetchInterval: 5_000,
  });
  const health = useQuery<DeepHealth>({
    queryKey: ['health'],
    queryFn: () => api.get<DeepHealth>(`${API_BASE}/health`),
    refetchInterval: 15_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['emergency-stop'] });
    queryClient.invalidateQueries({ queryKey: ['overview'] });
  };
  const activate = useMutation({
    mutationFn: () =>
      api.post<EmergencyStop>(
        `${API_BASE}/emergency-stop/activate`, { reason }),
    onSettled: invalidate,
  });
  const clear = useMutation({
    mutationFn: () =>
      api.post<EmergencyStop>(
        `${API_BASE}/emergency-stop/clear`, { reason }),
    onSettled: invalidate,
  });

  const s = stop.data;
  const err = (activate.error ?? clear.error) as { message?: string } | null;

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">
        Emergency stop
      </h1>

      <div className="max-w-xl space-y-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="label mb-0">Status</span>
            <StatusBadge status={s?.active ? 'EMERGENCY_STOP' : 'NORMAL'} />
          </div>
          {s?.active && (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <dt className="text-slate-400">Activated by</dt>
              <dd>{s.activatedBy}</dd>
              <dt className="text-slate-400">At</dt>
              <dd>{fmtDate(s.activatedAt)}</dd>
              {s.reason && (
                <>
                  <dt className="text-slate-400">Reason</dt>
                  <dd>{s.reason}</dd>
                </>
              )}
            </dl>
          )}
          {!s?.active && s?.clearedBy && (
            <p className="mt-3 text-sm text-slate-400">
              Last cleared by {s.clearedBy} at {fmtDate(s.clearedAt)}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            While active, new task dispatch, agent execution, tool calls and
            paid actions are blocked. The state is persisted — refresh,
            restart, and other sessions all see it. Clearing does not
            auto-resume anything.
          </p>
        </div>

        {isOwner && (
          <div className="card space-y-3">
            <div>
              <label className="label" htmlFor="reason">Reason (audited)</label>
              <input
                id="reason" className="input" value={reason}
                placeholder="e.g. runaway agent spend"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {s?.active ? (
              <ConfirmButton
                label="Clear emergency stop"
                confirmLabel="Clear"
                description={`Clear the emergency stop? Agents and missions do NOT resume automatically — re-enable what you intend to run.`}
                onConfirm={() => clear.mutate()}
              />
            ) : (
              <ConfirmButton
                label="ACTIVATE EMERGENCY STOP"
                confirmLabel="Activate now"
                danger
                description="This blocks all new dispatch, execution, tool use and paid actions across every agent until explicitly cleared. Audited."
                onConfirm={() => activate.mutate()}
              />
            )}
            {err && (
              <p role="alert" className="text-sm text-red-300">
                {err.message}
              </p>
            )}
          </div>
        )}

        <section aria-labelledby="health">
          <h2 id="health"
            className="mb-2 text-sm font-semibold text-slate-200">
            Service health
          </h2>
          <div className="card space-y-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={health.data?.status ?? 'UNKNOWN'} />
              <span className="text-xs text-slate-400">
                {health.data
                  ? `${health.data.passed} passed · ${health.data.failed} failed`
                  : 'loading…'}
              </span>
            </div>
            <ul className="space-y-1 text-sm">
              {health.data?.checks.map((c) => (
                <li key={c.name}
                  className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {c.message ?? ''}
                    </span>
                    <StatusBadge status={c.status} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

