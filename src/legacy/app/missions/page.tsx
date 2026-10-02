'use client';

import { useQuery } from '@tanstack/react-query';
import Link from '@/compat/link';
import { useState } from 'react';

import { AppShell, useIsOwner } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { api, API_BASE } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import type { MissionSummary, Page } from '@/lib/types';

const STATUSES = [
  '', 'CREATED', 'PLANNING', 'IN_PROGRESS', 'WAITING_FOR_APPROVAL',
  'REVIEWING', 'COMPLETED', 'FAILED', 'CANCELLED',
];

export default function MissionsPage() {
  const isOwner = useIsOwner();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const missions = useQuery<Page<MissionSummary>>({
    queryKey: ['missions', status, q, page],
    queryFn: () =>
      api.get<Page<MissionSummary>>(
        `${API_BASE}/missions${api.qs({
          status: status || undefined, q: q || undefined,
          page, size: 25,
        })}`,
      ),
    refetchInterval: 10_000,
  });

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between"><h1 className="text-xl font-semibold text-slate-100">Missions</h1>{isOwner && <Link className="btn btn-primary" href="/missions/new">New mission</Link>}</div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select
            id="status"
            className="input w-56"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'All'}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input
            id="q"
            className="input"
            placeholder="title or objective…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      <div className="card p-0">
        {missions.isPending ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : (
          <DataTable
            rows={missions.data?.items ?? []}
            rowKey={(m) => m.missionId}
            empty="No missions match"
            columns={[
              {
                header: 'Title',
                render: (m) => (
                  <Link href={`/missions/${m.missionId}`}>{m.title}</Link>
                ),
              },
              {
                header: 'Status',
                render: (m) => <StatusBadge status={m.status} />,
              },
              {
                header: 'Progress',
                render: (m) => `${m.completedTasks}/${m.totalTasks}`,
              },
              {
                header: 'Approvals',
                render: (m) => m.pendingApprovals || '—',
              },
              { header: 'Cost', render: (m) => fmtMoney(m.cost) },
              { header: 'Created', render: (m) => fmtDate(m.createdAt) },
            ]}
          />
        )}
      </div>

      {missions.data && missions.data.totalPages > 1 && (
        <nav
          aria-label="Mission pages"
          className="mt-3 flex items-center gap-2 text-sm"
        >
          <button
            type="button" className="btn"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-slate-400">
            {page + 1} / {missions.data.totalPages}
          </span>
          <button
            type="button" className="btn"
            disabled={page + 1 >= missions.data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </AppShell>
  );
}

