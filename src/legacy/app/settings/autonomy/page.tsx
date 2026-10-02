'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { ConfirmButton } from '@/components/ConfirmButton';
import { api, API_BASE, ControlPlaneError } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { AutonomyStatus } from '@/lib/types';

const MODES: { value: AutonomyStatus['mode']; label: string; hint: string }[] = [
  {
    value: 'GATED',
    label: 'Gated',
    hint: 'Every agent action requires an approved owner approval.',
  },
  {
    value: 'LIMITED_AUTO',
    label: 'Limited auto',
    hint: 'Low/medium-risk actions run autonomously; high-risk still asks.',
  },
  {
    value: 'FULL_AUTO',
    label: 'Full auto',
    hint: 'No per-action approval. Budgets and DENY policies still apply.',
  },
];

export default function AutonomyPage() {
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [selected, setSelected] = useState<AutonomyStatus['mode'] | null>(null);
  const [reason, setReason] = useState('');

  const autonomy = useQuery<AutonomyStatus>({
    queryKey: ['autonomy'],
    queryFn: () => api.get<AutonomyStatus>(`${API_BASE}/autonomy`),
    refetchInterval: 10_000,
  });

  const setMode = useMutation({
    mutationFn: (mode: AutonomyStatus['mode']) =>
      api.post<AutonomyStatus>(`${API_BASE}/autonomy`, {
        mode, reason: reason || undefined,
      }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['autonomy'] }),
  });

  const current = autonomy.data;
  const chosen = selected ?? current?.mode;
  const err = setMode.error as ControlPlaneError | null;

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">
        Autonomy level
      </h1>

      {autonomy.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}

      {current && (
        <div className="max-w-xl space-y-6">
          <div className="card">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-slate-400">Current mode</dt>
              <dd className="font-semibold text-slate-100">{current.mode}</dd>
              <dt className="text-slate-400">Set by</dt>
              <dd>{current.setBy} · {fmtDate(current.setAt)}</dd>
              {current.expiresAt && (
                <>
                  <dt className="text-slate-400">Expires</dt>
                  <dd>{fmtDate(current.expiresAt)}</dd>
                </>
              )}
              {current.reason && (
                <>
                  <dt className="text-slate-400">Reason</dt>
                  <dd>{current.reason}</dd>
                </>
              )}
            </dl>
            <p className="mt-3 rounded bg-ink p-3 text-sm text-slate-300">
              {current.effectiveRules}
            </p>
          </div>

          {isOwner ? (
            <fieldset className="card space-y-4">
              <legend className="label">Change mode</legend>
              <div className="space-y-2" role="radiogroup" aria-label="Autonomy mode">
                {MODES.map((m) => (
                  <label
                    key={m.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md
                      border p-3 ${
                        chosen === m.value
                          ? 'border-accent bg-accent/10'
                          : 'border-line'
                      }`}
                  >
                    <input
                      type="radio" name="autonomy" value={m.value}
                      checked={chosen === m.value}
                      onChange={() => setSelected(m.value)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">
                        {m.label}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {m.hint}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <label className="label" htmlFor="reason">
                  Reason (audited)
                </label>
                <input
                  id="reason" className="input" value={reason}
                  placeholder="why the change?"
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <ConfirmButton
                label="Apply mode"
                confirmLabel="Change autonomy"
                danger={chosen === 'FULL_AUTO'}
                disabled={!chosen || chosen === current.mode}
                description={`Set global autonomy to ${chosen}? Applies to all dispatch decisions immediately and is audited.`}
                onConfirm={() => chosen && setMode.mutate(chosen)}
              />
              {err && (
                <p role="alert" className="text-sm text-red-300">
                  {err.message}
                </p>
              )}
            </fieldset>
          ) : (
            <p className="text-sm text-slate-400">
              Only OWNER accounts can change autonomy.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}

