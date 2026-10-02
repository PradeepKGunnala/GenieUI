import { Design, Decisions, Decision, Delivery, DeliveryDetail } from './features/Design';
import DetailedOverview from './legacy/app/dashboard/page';
import MissionLedger from './legacy/app/missions/page';
import ModelUpdates from './legacy/app/models/page';
import Connections from './legacy/app/connections/page';
import NewMission from './legacy/app/missions/new/page';
import DetailedMission from './legacy/app/missions/[id]/page';
import AgentRegistry from './legacy/app/agents/page';
import AgentDetails from './legacy/app/agents/[id]/page';
import Budgets from './legacy/app/budgets/page';
import Costs from './legacy/app/costs/page';
import Policies from './legacy/app/policies/page';
import PolicyDetails from './legacy/app/policies/[id]/page';
import AutonomySettings from './legacy/app/settings/autonomy/page';
import EmergencySettings from './legacy/app/settings/emergency/page';
import ApprovalDetails from './legacy/app/approvals/[id]/page';
import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isTauri } from '@tauri-apps/api/core';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Bell, Brain, CircleHelp, Cpu, Gauge, GitBranch, LayoutDashboard, LockKeyhole, Menu, Radio, Search, Settings2, ShieldCheck, SquareTerminal, Wallet, X } from 'lucide-react';
import { api, ApiError } from './api/client';
import { ErrorNotice } from './components/Shared';
import { useLiveEvents } from './events/useLiveEvents';
import { useView } from './stores/view';
import { Trading } from './features/Trading';
import { Home } from './features/Home';
import { Missions, MissionPage } from './features/Missions';
import { Agents } from './features/Agents';
import { Approvals, Resources, Memory, Audit, System, Verticals } from './features/Operations';
import type { Me } from './types';

class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Render error', error, info.componentStack); }
  render() { return this.state.failed ? <main className="fatal"><h1>This view could not be loaded.</h1><button onClick={() => window.location.reload()}>Reload Genie</button></main> : this.props.children; }
}

function Login({ onLogin, offline }: { onLogin: () => void; offline: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useMutation({ mutationFn: () => api.login(username, password), onSuccess: onLogin });
  return <main className="login-wrap"><div className="login-brand"><span className="brand-mark">✦</span><span>GENIE <b>COMPANY OS</b></span></div>
    <form className="login-card" onSubmit={(event) => { event.preventDefault(); login.mutate(); }}><span className="eyebrow">CONTROL PLANE ACCESS</span><h1>Welcome back.</h1><p>Sign in to your company operating system.</p>
      <label>Username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>
      <label>Password<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {offline && <div className="error">Cannot reach the Genie backend on this device. Start the backend and retry.</div>}
      <ErrorNotice error={login.error} /><button type="submit" className="primary" disabled={login.isPending}>Sign in <ArrowRight size={17} /></button>
      <small>Access is controlled by the Genie backend. No credentials are saved here.</small></form></main>;
}

const navigation = [
  { group: 'WORKSPACE', items: [['/', 'Overview', LayoutDashboard], ['/missions', 'Missions', GitBranch], ['/design', 'Design Room', Brain], ['/decisions', 'Decisions', ShieldCheck], ['/delivery', 'Delivery', GitBranch], ['/agents', 'Agents', Cpu], ['/connections', 'Connections', Wallet], ['/approvals', 'Approvals', ShieldCheck], ['/resources', 'Resources', Wallet], ['/audit', 'Audit trail', Activity]] },
  { group: 'INTELLIGENCE', items: [['/memory', 'Memory', Brain], ['/evaluation', 'Evaluation', Gauge], ['/models', 'Model updates', Brain]] },
  { group: 'VERTICALS', items: [['/trading', 'Trading', Radio], ['/personal', 'Personal & career', CircleHelp], ['/droneos', 'DroneOS', SquareTerminal]] },
  { group: 'SYSTEM', items: [['/system', 'System health', Settings2], ['/budgets', 'Budgets', Wallet], ['/costs', 'Costs', Wallet], ['/policies', 'Policies', ShieldCheck], ['/settings/autonomy', 'Autonomy', Settings2], ['/settings/emergency', 'Emergency', ShieldCheck]] },
] as const;

function CommandDialog({ owner }: { owner: boolean }) {
  const open = useView((state) => state.commandOpen);
  const setOpen = useView((state) => state.setCommandOpen);
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();
  const client = useQueryClient();
  const create = useMutation({ mutationFn: async () => {
    const { missionId } = await api.createMission(draft.trim());
    try { await api.startMission(missionId); } catch (error) { navigate(`/missions/${missionId}`); setOpen(false); throw error; }
    return missionId;
  }, onSuccess: (id) => { setOpen(false); setDraft(''); void client.invalidateQueries(); navigate(`/missions/${id}`); } });
  if (!open) return null;
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="dialog" role="dialog" aria-modal="true" aria-label="Create mission">
    <div className="dialog-header"><span className="eyebrow">COMMAND MODE / NEW MISSION</span><button className="icon-button" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button></div>
    <h2>What should Genie accomplish?</h2><p><NavLink to="/missions/new" onClick={()=>setOpen(false)}>Use the full mission form to select connections, add constraints or save a draft →</NavLink></p><p>Your request produces an agent report through the mission planner. For simulated futures execution, use the Trading page and its separate approval gates.</p>
    <form onSubmit={(event) => { event.preventDefault(); if (draft.trim()) create.mutate(); }}><textarea autoFocus placeholder="Describe the outcome you want..." value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} maxLength={2000} required />
      <ErrorNotice error={create.error} /><div className="dialog-actions"><span>Owner authorization required</span><button className="primary" disabled={!owner || create.isPending || !draft.trim()} type="submit">{create.isPending ? 'Creating…' : 'Create mission'} <ArrowRight size={16} /></button></div></form>
  </div></div>;
}

function Shell({ user }: { user: Me }) {
  const [mobileNav, setMobileNav] = useState(false);
  const setCommandOpen = useView((state) => state.setCommandOpen);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === 'Escape') setCommandOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setCommandOpen]);
  const { connected: streamConnected, events } = useLiveEvents(true);
  const stop = useQuery({ queryKey: ['stop'], queryFn: api.stop });
  const connected = isTauri() ? stop.isSuccess : streamConnected;
  const client = useQueryClient();
  const logout = useMutation({ mutationFn: api.logout, onSuccess: () => { client.clear(); window.location.replace('/'); } });
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><div className="brand"><span className="brand-mark">✦</span><span>GENIE<small>COMPANY OS</small></span></div>
      <nav aria-label="Main navigation">{navigation.map(({ group, items }) => <div className="nav-group" key={group}><span className="nav-label">{group}</span>{items.map(([path, label, Icon]) => <NavLink key={path} end={path === '/'} onClick={() => setMobileNav(false)} to={path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</div>)}</nav>
      <div className="sidebar-foot"><div className="connection"><span className={`dot ${connected ? 'online' : ''}`} />{connected ? 'Live connection' : 'Reconnecting · 10s refresh'}</div><div className="identity"><span className="avatar">{user.displayName.charAt(0).toUpperCase()}</span><span><strong>{user.displayName}</strong><small>{user.role.toLowerCase()}</small></span><button aria-label="Sign out" className="icon-button" onClick={() => logout.mutate()}><LockKeyhole size={16} /></button></div></div>
    </aside><div className="workspace"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle menu"><Menu size={20} /></button><span className="breadcrumb">GENIE <span>/</span> CONTROL PLANE</span><div className="top-actions"><span className={`top-status ${stop.data?.active ? 'danger' : ''}`}><span className={`dot ${stop.data?.active ? 'red' : connected ? 'online' : ''}`} />{stop.data?.active ? 'EMERGENCY STOP ACTIVE' : stop.isSuccess ? 'SYSTEM LIVE' : 'STATUS UNKNOWN'}</span><button className="command-trigger" onClick={() => setCommandOpen(true)}><Search size={16} /><span>Ask Genie or create a mission</span><kbd>⌘ K</kbd></button><NavLink to="/approvals" className="icon-button" aria-label="Approvals"><Bell size={18} /></NavLink></div></header>
      <main className="content"><AppBoundary><Routes><Route path="/design" element={<Design owner={user.role === 'OWNER'} />} /><Route path="/decisions" element={<Decisions />} /><Route path="/decisions/:id" element={<Decision owner={user.role === 'OWNER'} />} /><Route path="/delivery" element={<Delivery />} /><Route path="/delivery/:id" element={<DeliveryDetail />} /><Route path="/" element={<Home events={events} owner={user.role === 'OWNER'} />} /><Route path="/missions" element={<Missions />} /><Route path="/dashboard" element={<DetailedOverview />} /><Route path="/missions/ledger" element={<MissionLedger />} /><Route path="/missions/new" element={<NewMission />} /><Route path="/missions/:id/controls" element={<DetailedMission />} /><Route path="/missions/:id" element={<MissionPage />} /><Route path="/agents/registry" element={<AgentRegistry />} /><Route path="/agents/:id" element={<AgentDetails />} /><Route path="/agents" element={<Agents owner={user.role === 'OWNER'} />} /><Route path="/approvals" element={<Approvals owner={user.role === 'OWNER'} />} /><Route path="/resources" element={<Resources />} /><Route path="/memory" element={<Memory />} /><Route path="/audit" element={<Audit />} /><Route path="/system" element={<System owner={user.role === 'OWNER'} />} /><Route path="/evaluation" element={<Verticals name="Evaluation" />} /><Route path="/trading" element={<Trading owner={user.role === 'OWNER'} />} /><Route path="/personal" element={<Verticals name="Personal & career" />} /><Route path="/droneos" element={<Verticals name="DroneOS" />} /><Route path="/connections" element={<Connections />} /><Route path="/models" element={<ModelUpdates />} /><Route path="/budgets" element={<Budgets />} /><Route path="/costs" element={<Costs />} /><Route path="/policies" element={<Policies />} /><Route path="/policies/:id" element={<PolicyDetails />} /><Route path="/settings/autonomy" element={<AutonomySettings />} /><Route path="/settings/emergency" element={<EmergencySettings />} /><Route path="/approvals/:id" element={<ApprovalDetails />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AppBoundary></main></div>
    <CommandDialog owner={user.role === 'OWNER'} />
  </div>;
}

export default function App() {
  const client = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: api.me, retry: false, refetchInterval: 30_000 });
  if (me.isPending) return <div className="boot"><span className="brand-mark">✦</span><p>Connecting to Genie…</p></div>;
  if (me.error) return <Login offline={!(me.error instanceof ApiError) || me.error.status === 0} onLogin={() => void client.resetQueries()} />;
  return <Shell user={me.data} />;
}
