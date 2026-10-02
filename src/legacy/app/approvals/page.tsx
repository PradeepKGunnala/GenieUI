'use client';

import { useQuery } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import type { ApprovalSummary, Page } from '@/lib/types';

export default function ApprovalsPage() {
  const [status, setStatus] = useState('PENDING');
  const [risk, setRisk] = useState('');
  const [page, setPage] = useState(0);

  const approvals = useQuery<Page<ApprovalSummary>>({
    queryKey: ['approvals', status, risk, page],
    queryFn: () =>
      api.get<Page<ApprovalSummary>>(
        `${API_BASE}/approvals${api.qs({
          status: status || undefined, riskLevel: risk || undefined,
          page, size: 25,
        })}`,
      ),
    refetchInterval: 7_500, // 5–10s poll
  });

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">Approvals</h1>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select
            id="status" className="input w-48" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          >
            {['PENDING', 'APPROVED', 'DENIED', ''].map((s) => (
              <option key={s} value={s}>{s || 'All'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="risk">Risk</label>
          <select
            id="risk" className="input w-40" value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(0); }}
          >
            {['', 'LOW', 'MEDIUM', 'HIGH'].map((r) => (
              <option key={r} value={r}>{r || 'All'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-0">
        {approvals.isPending ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <DataTable
            rows={approvals.data?.items ?? []}
            rowKey={(a) => a.approvalId}
            empty="No approvals match"
            columns={[
              { header: 'Requested', render: (a) => fmtDate(a.createdAt) },
              {
                header: 'Action',
                render: (a) => (
                  <Link href={`/approvals/${a.approvalId}`}>
                    {a.actionType}
                  </Link>
                ),
              },
              {
                header: 'Mission',
                render: (a) => (
                  <Link href={`/missions/${a.missionId}`}>
                    {a.missionTitle || a.missionId.slice(0, 8)}
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
        )}
      </div>

      {approvals.data && approvals.data.totalPages > 1 && (
        <nav
          aria-label="Approval pages"
          className="mt-3 flex items-center gap-2 text-sm"
        >
          <button
            type="button" className="btn" disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-slate-400">
            {page + 1} / {approvals.data.totalPages}
          </span>
          <button
            type="button" className="btn"
            disabled={page + 1 >= approvals.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </AppShell>
  );
}

