'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { api, API_BASE } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import type { MemoryDetail, MemoryItem } from '@/lib/types';

type SearchResponse = { results: MemoryItem[] };

export default function MemoryPage() {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('HYBRID');
  const [submitted, setSubmitted] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const results = useQuery<SearchResponse>({
    queryKey: ['memory-search', submitted, mode],
    queryFn: () =>
      api.get<SearchResponse>(
        `${API_BASE}/memory/search${api.qs({ q: submitted, mode })}`),
    enabled: submitted.length > 0,
  });

  const detail = useQuery<MemoryDetail>({
    queryKey: ['memory', selected],
    queryFn: () => api.get<MemoryDetail>(`${API_BASE}/memory/${selected}`),
    enabled: selected !== null,
  });

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold text-slate-100">
        Memory explorer
      </h1>

      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(q);
        }}
      >
        <div className="flex-1">
          <label className="label" htmlFor="q">Query</label>
          <input
            id="q" className="input" value={q} required
            placeholder="search semantic memory…"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="mode">Mode</label>
          <select id="mode" className="input w-36" value={mode}
            onChange={(e) => setMode(e.target.value)}>
            {['HYBRID', 'SEMANTIC', 'KEYWORD'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-0">
          {results.isFetching ? (
            <p className="p-6 text-sm text-slate-400">Searching…</p>
          ) : (
            <DataTable
              rows={results.data?.results ?? []}
              rowKey={(r) => r.chunkId}
              empty={
                submitted ? 'No matches' : 'Run a search to inspect memory'
              }
              columns={[
                {
                  header: 'Content',
                  render: (r) => (
                    <button
                      type="button"
                      className="text-left text-accent hover:underline
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-accent"
                      onClick={() => setSelected(r.chunkId)}
                    >
                      {r.content.length > 120
                        ? `${r.content.slice(0, 120)}…` : r.content}
                    </button>
                  ),
                },
                { header: 'Type', render: (r) => r.memoryType },
                {
                  header: 'Score',
                  render: (r) => r.finalScore.toFixed(3),
                },
                { header: 'When', render: (r) => fmtDate(r.createdAt) },
              ]}
            />
          )}
        </div>

        <div className="card">
          {selected === null ? (
            <p className="text-sm text-slate-500">
              Select a result to inspect it.
            </p>
          ) : detail.isPending ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : detail.data ? (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Chunk detail
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-slate-400">Type</dt>
                <dd>{detail.data.memoryType}</dd>
                <dt className="text-slate-400">Status</dt>
                <dd>{detail.data.memoryRecordStatus ?? '—'}</dd>
                <dt className="text-slate-400">Conversation</dt>
                <dd>
                  {detail.data.conversationTitle ??
                    detail.data.conversationId}
                  {detail.data.conversationSource
                    ? ` (${detail.data.conversationSource})`
                    : ''}
                </dd>
                <dt className="text-slate-400">Embedding</dt>
                <dd>
                  {detail.data.embeddingProvider ?? '—'}
                  {detail.data.embeddingModel
                    ? ` / ${detail.data.embeddingModel}`
                    : ''}
                </dd>
                <dt className="text-slate-400">Index</dt>
                <dd>{detail.data.chunkIndex}</dd>
                <dt className="text-slate-400">Created</dt>
                <dd>{fmtDate(detail.data.createdAt)}</dd>
              </dl>
              <p className="whitespace-pre-wrap rounded bg-ink p-3 text-sm text-slate-300">
                {detail.data.content}
              </p>
            </div>
          ) : (
            <p role="alert" className="text-sm text-red-300">
              Chunk not found.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

