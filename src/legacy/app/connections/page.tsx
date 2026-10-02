'use client';
import { ExternalConnections } from '@/components/ExternalConnections';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell, useIsOwner } from '@/components/AppShell';
import { api, API_BASE } from '@/lib/api';

type Connection = { provider: string; label: string; ticker: string | null; delayed: boolean; enabled: boolean; credential_configured: boolean; check_status: string | null; checked_at: string | null };
type Catalog = { connections: Connection[]; liveEnabled: boolean };
export default function ConnectionsPage() {
 const owner=useIsOwner(); const client=useQueryClient();
 const [label,setLabel]=useState('Polygon futures');const [key,setKey]=useState('');const [ticker,setTicker]=useState('');const [delayed,setDelayed]=useState(true);
 const [paperLabel,setPaperLabel]=useState('My paper account');const [message,setMessage]=useState('');
 const query=useQuery<Catalog>({queryKey:['connections'],queryFn:()=>api.get(`${API_BASE}/connections`),enabled:owner});
 const mutation=useMutation({mutationFn:async ({provider,action}:{provider:string;action:string})=>{
   if(action==='save') return api.put(`${API_BASE}/connections/${provider}`,provider==='POLYGON'?{label,apiKey:key||null,ticker,delayed}:{label:paperLabel});
   return api.post<{status?:string;message?:string}>(`${API_BASE}/connections/${provider}/${action}`);
 },onSuccess:(result)=>{setKey('');setMessage((result as {message?:string}).message??'Connection updated.');client.invalidateQueries({queryKey:['connections']});}});
 function act(provider:string,action:string){setMessage('');mutation.mutate({provider,action});}
 const polygon=query.data?.connections.find(c=>c.provider==='POLYGON');
 return <AppShell><h1 className="mb-2 text-xl font-semibold">Connections</h1>
 <p className="mb-6 text-sm text-slate-400">Configure market data and your simulated account. Live trading is disabled.</p>
 {!owner?<p className="card">Connection settings are available to owners only.</p>:<div className="max-w-4xl space-y-6">
 {query.isError&&<p role="alert" className="text-red-300">Unable to load connections.</p>}
 {mutation.isError&&<p role="alert" className="text-red-300">{mutation.error.message}</p>}
 {message&&<p role="status" className="text-emerald-300">{message}</p>}
 <ExternalConnections />
 <section className="card space-y-4"><h2 className="font-semibold">Polygon / Massive — futures market data</h2>
 <p className="text-sm text-slate-400">Read-only, completed one-minute futures bars. Keys are encrypted server-side and never returned. Use an expiry-specific contract ticker from your provider.</p>
 {polygon&&<p className="text-sm">Saved: {polygon.label} · {polygon.ticker} · {polygon.enabled?'Enabled':'Disconnected'} · {polygon.check_status??'Not checked'} · key {polygon.credential_configured?'stored':'missing'}<br/>Last check: {polygon.checked_at??'Never'}</p>}
 <form className="space-y-4" onSubmit={e=>{e.preventDefault();act('POLYGON','save');}}>
 <div><label className="label" htmlFor="connection-label">Connection label</label><input id="connection-label" className="input" required maxLength={100} value={label} onChange={e=>setLabel(e.target.value)}/></div>
 <div><label className="label" htmlFor="polygon-key">API key</label><input id="polygon-key" type="password" autoComplete="off" className="input" required={!polygon?.credential_configured} value={key} onChange={e=>setKey(e.target.value)} placeholder={polygon?.credential_configured?'Leave blank to retain saved key':'Enter API key'}/></div>
 <div><label className="label" htmlFor="contract-ticker">Test contract ticker</label><input id="contract-ticker" className="input" required pattern="[A-Z0-9]{2,20}" value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="Specific contract, not a continuous symbol"/></div>
 <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={delayed} onChange={e=>setDelayed(e.target.checked)}/>My subscription provides delayed data</label>
 <p className="text-xs text-slate-400">Delayed or stale data cannot authorize trading. Unchecking this does not bypass freshness or risk checks.</p>
 <button className="btn btn-primary" disabled={mutation.isPending}>Save market-data connection</button>
 </form>
 {polygon&&<div className="flex gap-3"><button className="btn" disabled={mutation.isPending} onClick={()=>act('POLYGON','check')}>Test data access</button><button className="btn" disabled={mutation.isPending||!polygon.enabled} onClick={()=>act('POLYGON','disconnect')}>Disconnect market data</button></div>}
 </section>
 <section className="card space-y-4"><h2 className="font-semibold">Paper trading account</h2><p className="text-sm text-slate-400">Local simulated broker. No funded-account credentials are accepted. Capital and risk limits belong to each futures mission.</p>
 <form className="space-y-3" onSubmit={e=>{e.preventDefault();act('PAPER','save');}}><label className="label" htmlFor="paper-label">Paper account label</label><input id="paper-label" className="input" required maxLength={100} value={paperLabel} onChange={e=>setPaperLabel(e.target.value)}/><button className="btn btn-primary" disabled={mutation.isPending}>Save paper account</button></form>
 {query.data?.connections.filter(c=>c.provider==='PAPER').map(c=><div key={c.provider} className="space-y-3"><p>{c.label} · {c.enabled?'Enabled':'Disconnected'} · {c.check_status??'Not checked'}</p><button className="btn" disabled={mutation.isPending} onClick={()=>act('PAPER','check')}>Test paper adapter</button></div>)}
 </section></div>}</AppShell>;
}
