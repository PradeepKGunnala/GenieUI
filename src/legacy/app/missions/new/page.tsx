'use client';

import { useState, useRef } from 'react';
import { useRouter } from '@/compat/navigation';
import Link from '@/compat/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell, useIsOwner } from '@/components/AppShell';
import type {ExternalConnection} from '@/components/ExternalConnections';
import { api, API_BASE } from '@/lib/api';

type CreatedMission = { missionId: string; status: string };
export default function NewMissionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isOwner = useIsOwner();
  const [connectionIds,setConnectionIds]=useState<string[]>([]);
  const connections=useQuery<ExternalConnection[]>({queryKey:['external-connections'],queryFn:()=>api.get(`${API_BASE}/connections/external`),enabled:isOwner});
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [constraints, setConstraints] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const submitting = useRef(false);
  const submit = useMutation({
    mutationFn: async (start: boolean) => {
      const mission = await api.post<CreatedMission>(`${API_BASE}/missions`, {
        title: title.trim(),
        connectionIds,
        objective: objective.trim() + (constraints.trim() ? `\n\nConstraints and acceptance criteria:\n${constraints.trim()}` : ''),
      });
      setCreatedId(mission.missionId);
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
      if (start) await api.post(`${API_BASE}/missions/${mission.missionId}/start`);
      return mission.missionId;
    },
    onSuccess: id => router.push(`/missions/${id}`),
    onSettled: () => { submitting.current = false; },
  });
  function save(start: boolean) {
    if (submitting.current || createdId || !title.trim() || !objective.trim() || !isOwner) return;
    submitting.current = true;
    submit.mutate(start);
  }
  return <AppShell>
    <Link href="/missions" className="text-sm">← Missions</Link>
    <h1 className="mb-2 mt-3 text-xl font-semibold">New mission</h1>
    <p className="mb-6 text-sm text-slate-400">Describe the result you want. Genie plans the work, assigns agents and tracks progress on the mission page.</p>
    {!isOwner ? <p className="card">Only an owner can create and start missions.</p> :
      <form className="card max-w-3xl space-y-5" onSubmit={e => { e.preventDefault(); save(true); }}>
        <fieldset disabled={submit.isPending || !!createdId} className="space-y-5">
          <div><label className="label" htmlFor="mission-title">Title</label>
            <input id="mission-title" className="input" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder="Compare two product ideas" /></div>
          <div><label className="label" htmlFor="mission-objective">Objective</label>
            <textarea id="mission-objective" className="input min-h-40" required value={objective} onChange={e => setObjective(e.target.value)} placeholder="What should Genie achieve? Describe the deliverable and how you will judge success." /></div>
          <div><label className="label" htmlFor="mission-constraints">Constraints and acceptance criteria (optional)</label>
            <textarea id="mission-constraints" className="input min-h-24" value={constraints} onChange={e => setConstraints(e.target.value)} placeholder="Scope, deadline, expected format and actions to avoid" />
            <p className="mt-2 text-xs text-slate-400">These instructions become part of the objective. System risk limits and approval policies still apply.</p></div>
          <fieldset><legend className="label">Required connections</legend>
            <p className="mb-2 text-xs text-slate-400">Selected services are read through governed tools before execution. The CEO must have permission. A failed check blocks start.</p>
            {connections.isError && <p role="alert">Unable to load connections. <Link href="/connections">Check connections</Link></p>}
            {connections.data?.length ? connections.data.map(c=><label className="mb-2 block text-sm" key={c.id}><input type="checkbox" disabled={c.status!=='CONNECTED'||!c.configuration.agentIds.includes('ceo-v1')} checked={connectionIds.includes(c.id)} onChange={e=>setConnectionIds(e.target.checked?[...connectionIds,c.id]:connectionIds.filter(id=>id!==c.id))}/> {c.name} · {c.configuration.checkedStatus} {c.status!=='CONNECTED'?'· disconnected':!c.configuration.agentIds.includes('ceo-v1')?'· CEO access missing':''}</label>):<p className="text-xs text-slate-400">No external services configured. <Link href="/connections">Add a connection</Link></p>}
          </fieldset>
        </fieldset>
        <p className="text-sm text-slate-400">Create and start begins execution. Save draft creates the mission without running it. Actions requiring approval appear in Approvals.</p>
        {submit.isError && <div role="alert" className="text-sm text-red-300">
          {createdId ? <>Mission saved, but execution could not start. <Link href={`/missions/${createdId}`}>Open the saved mission to retry.</Link></> : 'Unable to create the mission. Your inputs are retained.'}
          <p className="mt-1">{submit.error.message}</p>
        </div>}
        <div className="flex gap-3">
          <button className="btn btn-primary" type="submit" disabled={submit.isPending || !!createdId || !title.trim() || !objective.trim()}>{submit.isPending ? 'Submitting…' : 'Create and start'}</button>
          <button className="btn" type="button" onClick={() => save(false)} disabled={submit.isPending || !!createdId || !title.trim() || !objective.trim()}>Save draft</button>
        </div>
      </form>}
  </AppShell>;
}
