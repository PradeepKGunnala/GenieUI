'use client';

import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';

import type { TaskGraph } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { fmtDuration, fmtMoney } from '@/lib/format';

const STATUS_BORDER: Record<string, string> = {
  COMPLETED: '#065f46',
  FAILED: '#991b1b',
  CANCELLED: '#475569',
  BLOCKED: '#475569',
  IN_PROGRESS: '#075985',
  ASSIGNED: '#075985',
  WAITING_FOR_APPROVAL: '#92400e',
};

/**
 * Renders the backend-computed DAG — layout here is display-only (layered
 * by longest-path depth); statuses and edges come straight from the API.
 */
export function MissionGraph({ graph }: { graph: TaskGraph }) {
  const { nodes, edges } = useMemo(() => {
    const depth = new Map<string, number>();
    const visit = (id: string, seen: Set<string>): number => {
      if (depth.has(id)) return depth.get(id)!;
      if (seen.has(id)) return 0;
      seen.add(id);
      const parents = graph.edges
        .filter((e) => e.targetTaskId === id)
        .map((e) => e.sourceTaskId);
      const d = parents.length === 0
        ? 0
        : Math.max(...parents.map((p) => visit(p, seen))) + 1;
      depth.set(id, d);
      return d;
    };
    graph.nodes.forEach((n) => visit(n.taskId, new Set()));

    const perLayer = new Map<number, number>();
    const nodes: Node[] = graph.nodes.map((n) => {
      const d = depth.get(n.taskId) ?? 0;
      const row = perLayer.get(d) ?? 0;
      perLayer.set(d, row + 1);
      return {
        id: n.taskId,
        position: { x: d * 300, y: row * 110 },
        data: { label: n.title, node: n },
        type: 'task',
      };
    });

    const edges: Edge[] = graph.edges.map((e) => ({
      id: `${e.sourceTaskId}->${e.targetTaskId}`,
      source: e.sourceTaskId,
      target: e.targetTaskId,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#5b8cff' },
      style: { stroke: '#5b8cff' },
    }));
    return { nodes, edges };
  }, [graph]);

  return (
    <div className="card h-[480px] p-0" aria-label="Mission task graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{
          task: ({ data }) => {
            const node = data.node as TaskGraph['nodes'][number];
            return (
              <div
                className="w-64 rounded-lg border-2 bg-panel p-2 text-xs"
                style={{
                  borderColor:
                    STATUS_BORDER[node.status] ?? '#22304f',
                }}
              >
                {/* Edges need anchors: without Handles xyflow drops them */}
                <Handle type="target" position={Position.Left} />
                <Handle type="source" position={Position.Right} />
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-slate-200">
                    {node.title || '(untitled)'}
                  </span>
                  <StatusBadge status={node.status} />
                </div>
                <div className="space-y-0.5 text-slate-400">
                  <div>
                    {node.capability} · {node.priority}
                    {node.required ? ' · approval' : ''}
                  </div>
                  <div>
                    agent: {node.assignedAgentId ?? '—'}
                  </div>
                  <div>
                    {fmtMoney(node.cost)} · {fmtDuration(node.durationMs)}
                  </div>
                </div>
              </div>
            );
          },
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background gap={24} color="#1b2740" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

