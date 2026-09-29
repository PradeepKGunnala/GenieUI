export type Page<T> = { items: T[]; page: number; size: number; totalElements: number; totalPages: number };
export type Me = { username: string; displayName: string; role: 'OWNER' | 'VIEWER' };
export type Overview = {
  systemStatus: string; autonomyMode: string; emergencyStopActive: boolean;
  activeMissions: number; runningAgents: number; pendingApprovals: number;
  policyViolations: number; spendToday: number; dailyBudget: number;
  missionsCompletedToday: number; missionsFailedToday: number;
  agentsIdle: number; agentsDisabled: number;
  recentMissions: Mission[]; urgentApprovals: Approval[]; recentEvents: AuditEvent[];
};
export type Mission = {
  missionId: string; title: string; objectiveSummary: string; status: string; createdAt: string;
  startedAt: string | null; completedAt: string | null; ceoAgentId: string | null;
  totalTasks: number; completedTasks: number; blockedTasks: number; pendingApprovals: number; cost: number;
};
export type Task = {
  taskId: string; title: string; objective: string | null; status: string;
  priority: string; requiredCapability: string; assignedAgentId: string | null;
  retryCount: number; result: string | null; failureReason: string | null;
};
export type MissionDetail = Mission & { objective: string | null; finalResult: string | null; failureReason: string | null; tasks: Task[] };
export type TaskGraph = {
  nodes: { taskId: string; title: string; status: string; assignedAgentId: string | null; capability: string; priority: string }[];
  edges: { sourceTaskId: string; targetTaskId: string; dependencyType: string }[];
};
export type Agent = {
  agentId: string; displayName: string; role: string; effectiveStatus: string; configEnabled: boolean;
  capabilities: string[]; currentTaskTitle: string | null; activeExecutionCount: number;
  successRate: number | null; avgLatencyMs: number | null; costToday: number;
  modelProfile: string | null; killSwitchEngaged: boolean;
};
export type AgentDetail = { summary: Agent; recentExecutions: { executionId: string; status: string; startedAt: string; estimatedCost: number | null; error: string | null }[] };
export type Approval = {
  approvalId: string; missionId: string; missionTitle: string | null; taskTitle: string | null;
  requestingAgent: string | null; actionType: string; description: string | null;
  reason: string | null; riskLevel: string | null; estimatedCost: number | null;
  status: string; createdAt: string; expiresAt: string | null;
};
export type Budget = { budgetId: string; name: string; scope: string; limit: number; committed: number; reserved: number; available: number; utilizationPct: number; status: string; currency: string };
export type BudgetOverview = { dailyGlobal: Budget | null; monthlyGlobal: Budget | null; budgets: Budget[]; approaching: Budget[]; exhausted: Budget[] };
export type AgentCost = { agentId: string; totalCost: number; executionCount: number; averageCost: number; failedCount: number; inputTokens: number; outputTokens: number };
export type CostSummary = { spendToday: number; spendThisWeek: number; spendThisMonth: number; byAgent: AgentCost[]; byMission: { missionId: string; totalCost: number }[]; byModel: { modelName: string | null; totalCost: number }[] };
export type MemoryItem = { chunkId: string; conversationId: string; content: string; semanticScore: number; keywordScore: number; finalScore: number; memoryType: string; source: string; createdAt: string };
export type MemorySearch = { results: MemoryItem[] };
export type AuditEvent = { eventId: string; timestamp: string; eventType: string; actor: string; missionId: string | null; taskId: string | null; summary: string; correlationId: string | null; metadata: Record<string, unknown> };
export type Autonomy = { mode: 'GATED' | 'LIMITED_AUTO' | 'FULL_AUTO'; reason: string | null; setAt: string | null };
export type EmergencyStop = { active: boolean; reason: string | null; activatedAt: string | null };
export type Health = { status: string; passed: number; failed: number; checks: { name: string; status: string; message: string | null; durationMs: number }[] };
export type ChangeEvent = { type: string; data: Record<string, string>; timestamp: string };
