'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AppShell, useIsOwner } from '@/components/AppShell';
import { api, API_BASE } from '@/lib/api';
import { fmtDate } from '@/lib/format';

type Candidate = { modelId: string; revision: string; modifiedAt: string; task: string;
  license: string; licenseAssessment: string; sourceUrl: string; change: string };
type Report = { candidates: Candidate[]; followed: string[]; evidenceAt?: string;
  scans: { id: string; checkedAt: string; status: string; errors: string[] }[];
  profiles: Record<string, { provider: string; model: string; maxTokens?: number }>;
  dailyEnabled: boolean; automaticUpgradeEnabled: boolean; evaluationRequired: string[] };

export default function ModelsPage() {
  const owner = useIsOwner();
  const client = useQueryClient();
  const [onlyFollowed, setOnlyFollowed] = useState(false);
  const report = useQuery<Report>({ queryKey: ['model-watch'],
    queryFn: () => api.get<Report>(`${API_BASE}/models`), refetchInterval: 60_000 });
  const refresh = () => client.invalidateQueries({ queryKey: ['model-watch'] });
  const check = useMutation({ mutationFn: () => api.post(`${API_BASE}/models/check`), onSuccess: refresh });
  const follow = useMutation({ mutationFn: (body: { modelId: string; followed: boolean }) =>
    api.post(`${API_BASE}/models/follow`, body), onSuccess: refresh });
  const data = report.data;
  const latest = data?.scans[0];
  const stale = !data?.evidenceAt || Date.now() - Date.parse(data.evidenceAt) > 36 * 60 * 60 * 1000;
  const candidates = (data?.candidates ?? []).filter(c => !onlyFollowed || data?.followed.includes(c.modelId));
  return <AppShell>
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Model updates</h1>
      {owner && <button className="btn" disabled={check.isPending} onClick={() => check.mutate()}>
        {check.isPending ? 'Checking…' : 'Check now'}</button>}
    </div>
    <p className="mb-4 text-sm text-slate-400">Follow public model releases and revisions, compare with the configured stack,
      and decide what to evaluate. Daily metadata checks do not install models or change routing.</p>
    {report.isPending && <p role="status">Loading model watch…</p>}
    {report.isError && <p role="alert">Unable to load model watch: {report.error.message}</p>}
    {(check.isError || follow.isError) && <p role="alert">{check.error?.message || follow.error?.message}</p>}
    {data && <>
      <div className="card mb-4 text-sm">
        <p>Daily checks: {data.dailyEnabled ? 'enabled (once per UTC day while service is running)' : 'disabled'}.</p>
        <p>Latest attempt: {latest ? `${fmtDate(latest.checkedAt)} · ${latest.status}` : 'No checks yet'}.</p>
        <p>Catalog evidence: {fmtDate(data.evidenceAt)} {stale && <strong className="text-amber-300">· stale or missing</strong>}</p>
        {latest?.errors.map(e => <p key={e} role="alert" className="text-amber-300">{e}</p>)}
        <p className="mt-2">A modified repository is a candidate for review, not proof of a better model. Declared licenses require verification;
          open weights and open source are not interchangeable.</p>
      </div>
      <h2 className="mb-2 font-semibold">Current stack</h2>
      <div className="card mb-4 overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr><th>Profile</th><th>Provider</th><th>Configured model</th><th>Token limit</th></tr></thead>
        <tbody>{Object.entries(data.profiles).map(([name, p]) => <tr key={name}>
          <td className="py-2">{name}</td><td>{p.provider}</td><td>{p.model}</td><td>{p.maxTokens ?? '—'}</td>
        </tr>)}</tbody></table></div>
      <div className="mb-2 flex justify-between"><h2 className="font-semibold">Candidates to evaluate</h2>
        <label className="text-sm"><input type="checkbox" checked={onlyFollowed} onChange={e => setOnlyFollowed(e.target.checked)} /> Followed only</label></div>
      <div className="card mb-4 overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr><th>Model / evidence</th><th>Task</th><th>License</th><th>Next step</th><th>Follow</th></tr></thead>
        <tbody>{candidates.map(c => <tr key={c.modelId} className="border-t border-line">
          <td className="py-3 pr-4"><a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.modelId}</a>
            <div className="text-xs text-slate-400">{c.change.replaceAll('_', ' ')} · Modified {fmtDate(c.modifiedAt)} · {c.revision.slice(0, 12)}</div></td>
          <td className="pr-4">{c.task}</td><td className="pr-4">{c.license}<div className="text-xs text-slate-400">{c.licenseAssessment === 'LICENSE_REVIEW_REQUIRED' ? 'Review required' : 'Permissive declared; verify terms'}</div></td>
          <td className="pr-4">{c.licenseAssessment === 'LICENSE_REVIEW_REQUIRED' ? 'Verify license, then benchmark' : 'Check hardware and benchmark'}<div className="text-xs text-slate-400">No upgrade recommendation yet</div></td>
          <td><button className="btn" disabled={!owner || follow.isPending} onClick={() => follow.mutate({ modelId: c.modelId, followed: !data.followed.includes(c.modelId) })}>
            {data.followed.includes(c.modelId) ? 'Unfollow' : 'Follow'}</button></td>
        </tr>)}</tbody></table>
        {candidates.length === 0 && <p className="py-4 text-slate-400">No candidates in this view. Check scan status or change the filter.</p>}
      </div>
      {data.followed.filter(id => !data.candidates.some(c => c.modelId === id)).map(id => <p key={id} className="mb-2 text-sm text-amber-300">
        Followed model {id} is outside the latest publisher window; no current revision evidence available.</p>)}
      <div className="card mb-4"><h2 className="font-semibold">Before updating the stack</h2>
        <ol className="ml-5 mt-2 list-decimal text-sm text-slate-300">{data.evaluationRequired.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="mt-2 text-sm">Use Genie’s existing model evaluation harness with a separately configured candidate profile.
          Keep the current profile until the owner reviews results and a rollback path.</p></div>
      <details className="card"><summary>Recent daily checks</summary><ul className="mt-2 text-sm">
        {data.scans.map(s => <li key={s.id}>{fmtDate(s.checkedAt)} · {s.status}{s.errors.length > 0 ? ` · ${s.errors.join('; ')}` : ''}</li>)}
      </ul></details>
    </>}
  </AppShell>;
}
