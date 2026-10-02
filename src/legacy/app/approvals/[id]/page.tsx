'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useParams } from '@/compat/navigation';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE, ControlPlaneError } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import type { ApprovalDetail } from '@/lib/types';

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [comment, setComment] = useState('');

  const approval = useQuery<ApprovalDetail>({
    queryKey: ['approval', id],
    queryFn: () =>
      api.get<ApprovalDetail>(`${API_BASE}/approvals/${id}`),
    refetchInterval: 7_500,
  });

  const decide = useMutation({
    mutationFn: (decision: 'approve' | 'deny') =>
      api.post<ApprovalDetail>(
        `${API_BASE}/approvals/${id}/${decision}`,
        { comment: comment || undefined },
      ),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['approval', id] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  const a = approval.data?.summary;
  const highRisk = a?.riskLevel === 'HIGH';
  const pending = a?.status === 'PENDING';
  const err = decide.error as ControlPlaneError | null;

  return (
    <AppShell>
      <nav className="mb-3 text-sm" aria-label="Breadcrumb">
        <Link href="/approvals">Approvals</Link>
        <span className="text-slate-500"> / </span>
        <span className="text-slate-300">{id}</span>
      </nav>

      {approval.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {approval.isError && (
        <p role="alert" className="text-sm text-red-300">
          Approval not found.
        </p>
      )}

      {approval.data && a && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-slate-100">
                {a.actionType}
              </h1>
              <StatusBadge status={a.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <dt className="text-slate-400">Mission</dt>
              <dd>
                <Link href={`/missions/${a.missionId}`}>
                  {a.missionTitle || a.missionId}
                </Link>
              </dd>
              <dt className="text-slate-400">Requested by</dt>
              <dd>{a.requestingAgent ?? '—'}</dd>
              <dt className="text-slate-400">Risk level</dt>
              <dd>
                <span className={highRisk ? 'text-red-300 font-medium' : ''}>
                  {a.riskLevel ?? '—'}
                </span>
              </dd>
              <dt className="text-slate-400">Estimated cost</dt>
              <dd>{fmtMoney(a.estimatedCost)}</dd>
              <dt className="text-slate-400">Requested</dt>
              <dd>{fmtDate(a.createdAt)}</dd>
              <dt className="text-slate-400">Expires</dt>
              <dd>{fmtDate(a.expiresAt)}</dd>
            </dl>

            {a.description && (
              <div>
                <div className="label">Description</div>
                <p className="text-sm text-slate-300">{a.description}</p>
              </div>
            )}
            {a.reason && (
              <div>
                <div className="label">Reason</div>
                <p className="text-sm text-slate-300">{a.reason}</p>
              </div>
            )}
            {approval.data.proposedAction && (
              <div>
                <div className="label">Proposed action</div>
                <pre className="overflow-x-auto rounded bg-ink p-3 text-xs text-slate-300">
                  {JSON.stringify(approval.data.proposedAction, null, 2)}
                </pre>
              </div>
            )}

            {!pending && (
              <div className="rounded border border-line bg-ink p-3 text-sm">
                Decided by {a.decidedBy} at {fmtDate(a.decidedAt)}
                {approval.data.decisionComment && (
                  <p className="mt-1 text-slate-400">
                    “{approval.data.decisionComment}”
                  </p>
                )}
              </div>
            )}
          </div>

          {isOwner && pending && (
            <div className="card space-y-3">
              {highRisk && (
                <p role="note" className="text-sm font-medium text-amber-300">
                  High-risk action — review the proposed action carefully
                  before approving.
                </p>
              )}
              <div>
                <label className="label" htmlFor="comment">
                  Comment (audited)
                </label>
                <textarea
                  id="comment"
                  className="input"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-primary flex-1 justify-center"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate('approve')}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-danger flex-1 justify-center"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate('deny')}
                >
                  Deny
                </button>
              </div>
              {err && (
                <p role="alert" className="text-sm text-red-300">
                  {err.code === 'APPROVAL_ALREADY_DECIDED'
                    ? 'Already decided — refreshing shows the stored outcome.'
                    : err.message}
                </p>
              )}
            </div>
          )}
          {!isOwner && pending && (
            <p className="text-sm text-slate-400">
              Viewer accounts can review but not decide.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}

