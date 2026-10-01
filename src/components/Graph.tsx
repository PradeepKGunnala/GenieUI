import { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, type Edge, type Node, type NodeProps } from '@xyflow/react';
import type { Agent, TaskGraph } from '../types';
import { Status } from './Shared';

type GraphData = { title: string; subtitle: string; status: string };

function GraphCard({ data }: NodeProps<Node<GraphData>>) {
  return <div className="graph-card"><Handle type="target" position={Position.Top} /><div className="graph-card-head"><span className="mini-mark">✦</span><Status value={data.status} /></div><strong>{data.title}</strong><small>{data.subtitle}</small><Handle type="source" position={Position.Bottom} /></div>;
}

const nodeTypes = { card: GraphCard };

export function MissionGraph({ graph, onSelect }: { graph: TaskGraph; onSelect: (id: string) => void }) {
  const { nodes, edges } = useMemo(() => {
    const depths = new Map(graph.nodes.map((node) => [node.taskId, 0]));
    for (let i = 0; i < graph.nodes.length; i++) {
      let changed = false;
      for (const edge of graph.edges) {
        const source = depths.get(edge.sourceTaskId);
        const target = depths.get(edge.targetTaskId);
        if (source !== undefined && target !== undefined && source + 1 > target && source + 1 < graph.nodes.length) { depths.set(edge.targetTaskId, source + 1); changed = true; }
      }
      if (!changed) break;
    }
    const columns = new Map<number, number>();
    const nodes: Node<GraphData>[] = graph.nodes.map((task) => {
      const depth = depths.get(task.taskId) ?? 0;
      const row = columns.get(depth) ?? 0;
      columns.set(depth, row + 1);
      return { id: task.taskId, type: 'card', position: { x: depth * 280, y: row * 150 }, data: { title: task.title, subtitle: task.assignedAgentId || task.capability, status: task.status } };
    });
    const edges: Edge[] = graph.edges.map((edge) => ({ id: `${edge.sourceTaskId}-${edge.targetTaskId}`, source: edge.sourceTaskId, target: edge.targetTaskId, animated: false, style: { stroke: '#536a8a', strokeWidth: 1.5 } }));
    return { nodes, edges };
  }, [graph]);
  return <div className="graph" aria-label="Mission task dependency graph"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, node) => onSelect(node.id)} fitView fitViewOptions={{ padding: 0.2 }} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: true }}><Background color="#25354c" gap={25} /><Controls showInteractive={false} /></ReactFlow></div>;
}

export function OrganizationGraph({ agents, onSelect }: { agents: Agent[]; onSelect: (id: string) => void }) {
  const nodes: Node<GraphData>[] = [{ id: 'owner', type: 'card', position: { x: 310, y: 0 }, data: { title: 'Owner', subtitle: 'Human authority', status: 'ACTIVE' } }];
  const ceo = agents.find((agent) => /ceo/i.test(agent.role) || /ceo/i.test(agent.agentId));
  if (ceo) nodes.push({ id: ceo.agentId, type: 'card', position: { x: 310, y: 150 }, data: { title: ceo.displayName, subtitle: ceo.role, status: ceo.effectiveStatus } });
  const members = agents.filter((agent) => agent.agentId !== ceo?.agentId);
  members.forEach((agent, index) => nodes.push({ id: agent.agentId, type: 'card', position: { x: (index % 3) * 255 + 50, y: Math.floor(index / 3) * 150 + (ceo ? 310 : 165) }, data: { title: agent.displayName, subtitle: agent.role, status: agent.effectiveStatus } }));
  const edges: Edge[] = agents.map((agent) => ({ id: `reports-${agent.agentId}`, source: ceo && agent.agentId !== ceo.agentId ? ceo.agentId : 'owner', target: agent.agentId, style: { stroke: '#536a8a', strokeWidth: 1.5 } }));
  return <div className="graph organization-graph" aria-label="Agent organization graph"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, node) => { if (node.id !== 'owner') onSelect(node.id); }} fitView fitViewOptions={{ padding: 0.2 }} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: true }}><Background color="#25354c" gap={25} /><Controls showInteractive={false} /></ReactFlow></div>;
}
