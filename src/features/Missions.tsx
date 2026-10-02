import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { MissionGraph } from '../components/Graph';
import { date, Empty, ErrorNotice, money, PageHeading, Panel, Status } from '../components/Shared';
import { useView } from '../stores/view';
import { MissionLogs } from './MissionLogs';
import { explainFailure, missionStage } from './missionLog';

export function Missions() {
  const [q, setQ] = useState('');
  const missions = useQuery({ queryKey: ['missions', q], queryFn: () => api.missions(q) });
  return <><Link className="back-link" to="/missions/ledger">Advanced filters and paginated ledger →</Link><PageHeading eyebrow="COMPANY / EXECUTION" title="Missions" description="Every objective, plan, and outcome in one place." action={<Link className="primary" to="/missions/new">New mission</Link>} /><div className="filter-bar"><Search size={18} /><input aria-label="Search missions" placeholder="Search missions..." value={q} onChange={(event) => setQ(event.target.value)} /></div><ErrorNotice error={missions.error} />
    <Panel title="Mission ledger" action={<span className="subtle">{missions.data?.totalElements ?? 0} total</span>}><div className="table-wrap"><table><thead><tr><th>MISSION</th><th>STATUS</th><th>PROGRESS</th><th>COST</th><th>CREATED</th></tr></thead><tbody>{missions.data?.items.map((mission) => <tr key={mission.missionId}><td><Link to={`/missions/${mission.missionId}`} className="table-link">{mission.title}</Link><small>{mission.objectiveSummary}</small></td><td><Status value={mission.status === 'COMPLETED' ? 'AGENT_REPORT_READY' : mission.status} /></td><td><div className="progress"><span style={{ width: `${mission.totalTasks ? mission.completedTasks / mission.totalTasks * 100 : 0}%` }} /></div><small>{mission.completedTasks} / {mission.totalTasks} tasks</small></td><td>{money(mission.cost)}</td><td>{date(mission.createdAt)}</td></tr>)}</tbody></table>{!missions.data?.items.length && <Empty title={missions.isPending ? 'Loading missions…' : 'No missions found'} detail="Create a mission using the command button above." />}</div></Panel>
  </>;
}

export function MissionPage() {
  const { id = '' } = useParams();
  const detail = useQuery({ queryKey: ['mission', id], queryFn: () => api.mission(id), enabled: !!id, refetchInterval: 3000 });
  const graph = useQuery({ queryKey: ['graph', id], queryFn: () => api.graph(id), enabled: !!id, refetchInterval: 3000 });
  const selectedTask = useView((state) => state.selectedTask);
  const setTask = useView((state) => state.setTask);
  const task = detail.data?.tasks.find((entry) => entry.taskId === selectedTask);
  return <><Link className="back-link" to="/missions"><ArrowLeft size={16} /> All missions</Link><PageHeading eyebrow={`MISSION / ${id.slice(0, 8).toUpperCase()}`} title={detail.data?.title || 'Mission detail'} description={detail.data?.objective || 'Loading the mission plan…'} action={detail.data && <Status value={detail.data.status === 'COMPLETED' ? 'AGENT_REPORT_READY' : detail.data.status} />} /><ErrorNotice error={detail.error || graph.error} />
    {detail.data && <div className={`mission-stage ${detail.data.status === 'FAILED' ? 'mission-stage-failed' : ''}`} role="status"><strong>{missionStage(detail.data.status)}</strong>{detail.data.recoveryReason && <p>CEO supervising recovery: {detail.data.recoveryReason}<br />Attempt {detail.data.recoveryAttempts ?? 0}{detail.data.nextRecoveryAt && <> · Next retry: {date(detail.data.nextRecoveryAt)}</>}</p>}{detail.data.failureReason && <><p>{explainFailure(detail.data.failureReason)}</p><code>{detail.data.failureReason}</code></>}</div>}
    {detail.data?.finalResult && <Panel title="Agent report"><p>This report is generated from agent outputs. Trading balances, backtests and trades require separate paper-engine records.</p><Link to="/trading">Open verified paper-trading records →</Link><div className="mission-result">{detail.data.finalResult}</div></Panel>}
    <div className="metrics-grid three"><div className="metric"><span>TASKS COMPLETED</span><strong>{detail.data ? `${detail.data.completedTasks} / ${detail.data.totalTasks}` : '—'}</strong></div><div className="metric"><span>BLOCKED TASKS</span><strong>{detail.data?.blockedTasks ?? '—'}</strong></div><div className="metric"><span>MISSION COST</span><strong>{detail.data ? money(detail.data.cost) : '—'}</strong></div></div>
    <div className="dashboard-grid mission-layout"><Panel title="Execution graph" className="graph-panel" action={<span className="subtle">Select a task for details</span>}>{graph.data?.nodes.length ? <MissionGraph graph={graph.data} onSelect={setTask} /> : <Empty title={graph.isPending ? 'Loading graph…' : 'No tasks planned yet'} detail="The backend creates the task graph when the mission starts." />}</Panel>
      <Panel title="Task inspector">{task ? <div className="inspector"><Status value={task.status} /><h3>{task.title}</h3><p>{task.objective || 'No task objective available.'}</p><dl><dt>Assigned agent</dt><dd>{task.assignedAgentId || 'Unassigned'}</dd><dt>Capability</dt><dd>{task.requiredCapability}</dd><dt>Priority</dt><dd>{task.priority}</dd><dt>Retries</dt><dd>{task.retryCount}</dd></dl>{task.waitingReason && <p role="status">Waiting: {task.waitingReason}</p>}{task.failureReason && <div className="error">{task.failureReason}</div>}{task.result && <p>{task.result}</p>}</div> : <Empty title="Select a task" detail="Click a node in the execution graph to inspect its state." />}</Panel></div>
    <div className="panel"><Link to={`/missions/${id}/controls`}>Mission controls, approvals, costs and audit →</Link></div>
    <MissionLogs key={id} missionId={id} mission={detail.data} />
  </>;
}
