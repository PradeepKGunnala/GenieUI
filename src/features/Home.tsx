import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Plus, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { OrganizationGraph } from '../components/Graph';
import { date, DetailLink, Empty, ErrorNotice, Metric, money, PageHeading, Panel, Status } from '../components/Shared';
import { useView } from '../stores/view';
import type { ChangeEvent } from '../types';

export function Home({ events, owner }: { events: ChangeEvent[]; owner: boolean }) {
  const overview = useQuery({ queryKey: ['overview'], queryFn: api.overview });
  const agents = useQuery({ queryKey: ['agents'], queryFn: api.agents });
  const navigate = useNavigate();
  const openCommand = useView((state) => state.setCommandOpen);
  const data = overview.data;
  return <><PageHeading eyebrow={`${new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toUpperCase()} · CONTROL CENTER`} title="Your company, at a glance." description="A live view of what Genie is doing, what needs you, and what it costs." action={<button className="primary" onClick={() => openCommand(true)} disabled={!owner}><Plus size={17} /> New mission</button>} />
    <ErrorNotice error={overview.error || agents.error} />
    {data?.emergencyStopActive && <div className="alert-banner"><ShieldAlert size={20} /> Emergency stop is active. New autonomous actions are blocked. <DetailLink to="/system">Inspect controls</DetailLink></div>}
    <div className="metrics-grid"><Metric label="ACTIVE MISSIONS" value={data?.activeMissions ?? '—'} note={`${data?.missionsCompletedToday ?? '—'} completed today`} /><Metric label="AGENTS RUNNING" value={data?.runningAgents ?? '—'} note={`${data?.agentsIdle ?? '—'} available`} /><Metric label="AWAITING YOUR APPROVAL" value={data?.pendingApprovals ?? '—'} note="Owner decisions pending" /><Metric label="SPEND TODAY" value={data ? money(data.spendToday) : '—'} note={data ? `of ${money(data.dailyBudget)} daily budget` : 'Loading budget'} /></div>
    <div className="dashboard-grid"><Panel title="Organization live" className="graph-panel" action={<DetailLink to="/agents">All agents</DetailLink>}><div className="panel-subtitle">Your team and its current state, directly from the agent registry.</div>{agents.data?.length ? <OrganizationGraph agents={agents.data} onSelect={() => navigate('/agents')} /> : <Empty title={agents.isPending ? 'Connecting to agents…' : 'No agents registered'} detail="Agent nodes appear here when the backend is available." />}</Panel>
      <Panel title="Needs your attention" action={<DetailLink to="/approvals">View inbox</DetailLink>}><div className="panel-subtitle">Actions waiting for an owner decision.</div><div className="stack">{data?.urgentApprovals?.length ? data.urgentApprovals.slice(0, 5).map((approval) => <div className="list-row" key={approval.approvalId}><div className="row-icon amber">!</div><div className="row-main"><strong>{approval.actionType.replaceAll('_', ' ')}</strong><small>{approval.missionTitle || 'Governed action'} · {approval.requestingAgent || 'System'}</small></div><ArrowUpRight size={17} /></div>) : <Empty title="No pending approvals" detail="The inbox is clear." />}</div></Panel></div>
    <div className="dashboard-grid bottom-grid"><Panel title="Recent missions" action={<DetailLink to="/missions">View all missions</DetailLink>}><div className="stack">{data?.recentMissions?.length ? data.recentMissions.slice(0, 5).map((mission) => <button className="list-row clickable" key={mission.missionId} onClick={() => navigate(`/missions/${mission.missionId}`)}><div className="row-icon blue">↗</div><div className="row-main"><strong>{mission.title}</strong><small>{mission.completedTasks}/{mission.totalTasks} tasks · {date(mission.createdAt)}</small></div><Status value={mission.status} /></button>) : <Empty title="No missions yet" detail="Create your first mission to see it here." />}</div></Panel>
      <Panel title="Activity stream" action={<DetailLink to="/audit">Audit trail</DetailLink>}><div className="stack">{events.length ? events.slice(0, 4).map((event, index) => <div className="list-row" key={`${event.timestamp}-${index}`}><div className="row-icon blue">•</div><div className="row-main"><strong>{event.type.replaceAll('_', ' ')}</strong><small>{date(event.timestamp)}</small></div></div>) : data?.recentEvents?.length ? data.recentEvents.slice(0, 4).map((event) => <div className="list-row" key={event.eventId}><div className="row-icon blue">•</div><div className="row-main"><strong>{event.summary}</strong><small>{date(event.timestamp)}</small></div></div>) : <Empty title="No recent activity" detail="Backend events and audit entries appear here." />}</div></Panel></div>
    <div className="footer-note"><DetailLink to="/dashboard">Detailed overview metrics</DetailLink> · Genie operates within owner approved controls. <a href="/system">Review system status <ArrowRight size={14} /></a></div>
  </>;
}
