import {Link} from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrganizationGraph } from '../components/Graph';
import { date, Empty, ErrorNotice, money, PageHeading, Panel, Status } from '../components/Shared';
import { api } from '../api/client';
import { useView } from '../stores/view';

export function Agents({ owner }: { owner: boolean }) {
  const agents = useQuery({ queryKey: ['agents'], queryFn: api.agents });
  const selected = useView((state) => state.selectedAgent);
  const setSelected = useView((state) => state.setAgent);
  const detail = useQuery({ queryKey: ['agent', selected], queryFn: () => api.agent(selected!), enabled: !!selected });
  const [reason, setReason] = useState('');
  const client = useQueryClient();
  const toggle = useMutation({ mutationFn: (enabled: boolean) => api.setAgent(selected!, enabled, reason.trim()), onSuccess: () => { setReason(''); void client.invalidateQueries({ queryKey: ['agents'] }); void client.invalidateQueries({ queryKey: ['agent', selected] }); } });
  const agent = detail.data?.summary;
  return <><Link className="back-link" to="/agents/registry">Full agent registry and metrics →</Link><PageHeading eyebrow="COMPANY / TEAM" title="The organization" description="People, processes, and autonomous agents working together." /><ErrorNotice error={agents.error} />
    <div className="dashboard-grid mission-layout"><Panel title="Live organization graph" className="graph-panel" action={<span className="subtle">{agents.data?.length ?? 0} registered agents</span>}>{agents.data?.length ? <OrganizationGraph agents={agents.data} onSelect={setSelected} /> : <Empty title={agents.isPending ? 'Loading team…' : 'No registered agents'} />}</Panel>
      <Panel title="Agent inspector">{selected ? <><ErrorNotice error={detail.error || toggle.error} />{agent && <div className="inspector"><Status value={agent.effectiveStatus} /><h3>{agent.displayName}</h3><p>{agent.role}</p><dl><dt>Current task</dt><dd>{agent.currentTaskTitle || 'None'}</dd><dt>Active executions</dt><dd>{agent.activeExecutionCount}</dd><dt>Success rate</dt><dd>{agent.successRate === null ? 'Unavailable' : `${Math.round(agent.successRate * 100)}%`}</dd><dt>Average latency</dt><dd>{agent.avgLatencyMs === null ? 'Unavailable' : `${Math.round(agent.avgLatencyMs)} ms`}</dd><dt>Spend today</dt><dd>{money(agent.costToday)}</dd><dt>Model profile</dt><dd>{agent.modelProfile || 'Unavailable'}</dd><dt>Capabilities</dt><dd>{agent.capabilities.join(', ') || 'None'}</dd></dl>{owner && <div className="control-box"><label>Reason for {agent.configEnabled ? 'disabling' : 'enabling'}<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Required for audit" /></label><button className="secondary" disabled={!reason.trim() || toggle.isPending} onClick={() => { if (window.confirm(`${agent.configEnabled ? 'Disable' : 'Enable'} ${agent.displayName}?`)) toggle.mutate(!agent.configEnabled); }}>{agent.configEnabled ? 'Disable agent' : 'Enable agent'}</button></div>}</div>}</> : <Empty title="Select an agent" detail="Click a node to see its performance, activity, and controls." />}</Panel></div>
    <Panel title="Agent registry"><div className="table-wrap"><table><thead><tr><th>AGENT</th><th>STATE</th><th>CURRENT TASK</th><th>SUCCESS RATE</th><th>SPEND TODAY</th></tr></thead><tbody>{agents.data?.map((item) => <tr key={item.agentId} onClick={() => setSelected(item.agentId)} className="clickable"><td><strong>{item.displayName}</strong><small>{item.role}</small></td><td><Status value={item.effectiveStatus} /></td><td>{item.currentTaskTitle || '—'}</td><td>{item.successRate === null ? '—' : `${Math.round(item.successRate * 100)}%`}</td><td>{money(item.costToday)}</td></tr>)}</tbody></table>{!agents.data?.length && <Empty title="No agents found" />}</div></Panel>
    {detail.data?.recentExecutions.length ? <Panel title="Recent executions"><div className="table-wrap"><table><thead><tr><th>EXECUTION</th><th>STATUS</th><th>STARTED</th><th>COST</th></tr></thead><tbody>{detail.data.recentExecutions.map((execution) => <tr key={execution.executionId}><td className="mono">{execution.executionId.slice(0, 8)}</td><td><Status value={execution.status} /></td><td>{date(execution.startedAt)}</td><td>{execution.estimatedCost === null ? '—' : money(execution.estimatedCost)}</td></tr>)}</tbody></table></div></Panel> : null}
  </>;
}
