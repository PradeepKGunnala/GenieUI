'use client';

import { useMemo } from 'react';
import Link from '@/compat/link';
import { Background, Controls, Handle, Position, ReactFlow, type Node, type NodeProps, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { AgentSummary } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { NavIcon } from './NavIcon';

type AgentNode = Node<{ agent: AgentSummary }, 'agent'>;
function OrganizationNode({ data }: NodeProps<AgentNode>) {
  const a = data.agent;
  return <div className="w-60 rounded-lg border border-line bg-panel p-3 text-xs">
    <Handle type="target" position={Position.Top} />
    <div className="mb-2 flex items-center justify-between gap-2">
      <NavIcon href="/agents" /><StatusBadge status={a.effectiveStatus} />
    </div>
    <Link href={`/agents/${encodeURIComponent(a.agentId)}`} className="font-semibold">{a.displayName}</Link>
    <div className="mt-1 text-slate-400">{a.role.replaceAll('_', ' ')} · {a.agentId}</div>
    <div className="mt-2 truncate text-slate-300" title={a.currentTaskTitle ?? undefined}>{a.currentTaskTitle ?? 'No current task'}</div>
    {a.killSwitchEngaged && <div className="mt-1 text-red-300">Kill switch engaged</div>}
    <Handle type="source" position={Position.Bottom} />
  </div>;
}
const nodeTypes = { agent: OrganizationNode };
const executiveRoles = new Set(['CFO', 'COO', 'CPO', 'CTO']);

export function AgentOrganization({ agents }: { agents: AgentSummary[] }) {
  const { nodes, edges } = useMemo(() => {
    const sorted = [...agents].sort((a, b) => a.agentId.localeCompare(b.agentId));
    const coordinators = sorted.filter(a => a.role === 'CEO');
    const executives = sorted.filter(a => executiveRoles.has(a.role));
    const specialists = sorted.filter(a => a.role !== 'CEO' && !executiveRoles.has(a.role));
    const groups = [coordinators, executives, specialists];
    const widest = Math.max(1, ...groups.map(g => Math.min(g.length, 4)));
    let y = 0;
    const nodes: AgentNode[] = [];
    groups.forEach(group => {
      if (!group.length) return;
      const columns = Math.min(group.length, 4);
      group.forEach((agent, index) => nodes.push({ id: agent.agentId, type: 'agent',
        position: { x: (widest - columns) * 140 + index % columns * 280, y: y + Math.floor(index / columns) * 180 }, data: { agent } }));
      y += Math.ceil(group.length / columns) * 180 + 60;
    });
    const edges: Edge[] = coordinators.length === 1 ? sorted.filter(a => a.role !== 'CEO').map(a => ({
      id: `${coordinators[0].agentId}-${a.agentId}`, source: coordinators[0].agentId, target: a.agentId,
      style: { stroke: '#5b8cff', strokeDasharray: '5 5' },
      animated: a.activeExecutionCount > 0,
    })) : [];
    return { nodes, edges };
  }, [agents]);
  if (!agents.length) return <p className="p-6 text-slate-400">No agents registered</p>;
  return <div className="h-[600px] rounded-lg border border-line" role="region" aria-label="Live agent organization">
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2} nodesDraggable={false} nodesConnectable={false} colorMode="dark" proOptions={{ hideAttribution: true }}>
      <Background gap={24} color="#22304f" /><Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}
