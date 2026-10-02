/** DTO shapes mirroring the control-plane backend (never entities). */

export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ApiError = {
  code: string;
  message: string;
  correlationId?: string;
  timestamp?: string;
};

export type Me = {
  username: string;
  displayName: string;
  role: 'OWNER' | 'VIEWER';
  authenticated: boolean;
};

export type Overview = {
  systemStatus: string;
  autonomyMode: string;
  emergencyStopActive: boolean;
  activeMissions: number;
  runningAgents: number;
  pendingApprovals: number;
  policyViolations: number;
  spendToday: number;
  dailyBudget: number;
  missionsCompletedToday: number;
  missionsFailedToday: number;
  agentsIdle: number;
  agentsDisabled: number;
  recentMissions: MissionSummary[];
  urgentApprovals: ApprovalSummary[];
  recentEvents: AuditEvent[];
};

export type MissionSummary = {
  missionId: string;
  title: string;
  objectiveSummary: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  ceoAgentId: string | null;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  pendingApprovals: number;
  cost: number;
};

export type TaskSummary = {
  taskId: string;
  missionId: string;
  title: string;
  objective: string | null;
  status: string;
  priority: string;
  requiredCapability: string;
  assignedAgentId: string | null;
  approvalRequired: boolean;
  retryCount: number;
  position: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  result: string | null;
  failureReason: string | null;
};

export type MissionDetail = Omit<MissionSummary, 'objectiveSummary'> & {
  objective: string | null;
  createdBy: string | null;
  updatedAt: string;
  finalResult: string | null;
  failureReason: string | null;
  version: number;
  failedTasks: number;
  waitingForApproval: number;
  tasks: TaskSummary[];
};

export type TaskGraph = {
  missionId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphNode = {
  taskId: string;
  title: string;
  status: string;
  assignedAgentId: string | null;
  capability: string;
  priority: string;
  required: boolean;
  cost: number | null;
  durationMs: number | null;
};

export type GraphEdge = {
  sourceTaskId: string;
  targetTaskId: string;
  dependencyType: string;
};

export type AgentSummary = {
  agentId: string;
  displayName: string;
  role: string;
  effectiveStatus: string;
  configuredStatus: string;
  configEnabled: boolean;
  killSwitchEngaged: boolean;
  capabilities: string[];
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  activeExecutionCount: number;
  lastExecutionAt: string | null;
  successRate: number | null;
  avgLatencyMs: number | null;
  costToday: number;
  modelProfile: string | null;
  controlVersion: number;
};

export type AgentExecution = {
  executionId: string;
  agentId: string;
  missionId: string | null;
  taskId: string | null;
  status: string;
  correlationId: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  modelProvider: string | null;
  modelName: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCost: number | null;
  error: string | null;
};

export type AgentDetail = {
  summary: AgentSummary;
  implementationType: string | null;
  maxConcurrentTasks: number;
  requiresOwnerApprovalForHighRisk: boolean;
  metadata: Record<string, string> | null;
  controlReason: string | null;
  controlUpdatedBy: string | null;
  controlUpdatedAt: string | null;
  recentExecutions: AgentExecution[];
  recentFailures: AgentExecution[];
};

export type ApprovalSummary = {
  approvalId: string;
  missionId: string;
  missionTitle: string | null;
  taskId: string | null;
  taskTitle: string | null;
  requestingAgent: string | null;
  actionType: string;
  description: string | null;
  reason: string | null;
  riskLevel: string | null;
  estimatedCost: number | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
};

export type ApprovalDetail = {
  summary: ApprovalSummary;
  proposedAction: Record<string, unknown> | null;
  decisionComment: string | null;
};

export type BudgetSummary = {
  budgetId: string;
  name: string;
  scope: string;
  scopeRef: string;
  period: string;
  limit: number;
  committed: number;
  reserved: number;
  available: number;
  utilizationPct: number;
  warningThresholdPct: number;
  hardStopThresholdPct: number | null;
  enabled: boolean;
  status: 'OK' | 'WARNING' | 'EXHAUSTED' | 'DISABLED';
  currency: string;
  version: number;
};

export type BudgetOverview = {
  dailyGlobal: BudgetSummary | null;
  monthlyGlobal: BudgetSummary | null;
  budgets: BudgetSummary[];
  approaching: BudgetSummary[];
  exhausted: BudgetSummary[];
};

export type AgentCost = {
  agentId: string;
  totalCost: number;
  executionCount: number;
  averageCost: number;
  failedCount: number;
  inputTokens: number;
  outputTokens: number;
};

export type MissionCost = {
  missionId: string;
  totalCost: number;
  executionCount: number;
};

export type ModelCost = {
  modelProvider: string | null;
  modelName: string | null;
  totalCost: number;
  executionCount: number;
  inputTokens: number;
  outputTokens: number;
};

export type CostSummary = {
  spendToday: number;
  spendThisWeek: number;
  spendThisMonth: number;
  byAgent: AgentCost[];
  byMission: MissionCost[];
  byModel: ModelCost[];
};

export type MemoryItem = {
  chunkId: string;
  conversationId: string;
  memoryRecordId: string | null;
  content: string;
  semanticScore: number;
  keywordScore: number;
  finalScore: number;
  memoryType: string;
  source: string;
  createdAt: string;
};

export type MemoryDetail = {
  chunkId: string;
  conversationId: string;
  conversationTitle: string | null;
  conversationSource: string | null;
  memoryRecordId: string | null;
  memoryType: string;
  memoryRecordStatus: string | null;
  chunkIndex: number;
  content: string;
  embeddingProvider: string | null;
  embeddingModel: string | null;
  createdAt: string;
};

export type AuditEvent = {
  eventId: string;
  timestamp: string;
  eventType: string;
  actor: string;
  missionId: string | null;
  taskId: string | null;
  summary: string;
  correlationId: string | null;
  metadata: Record<string, unknown>;
};

export type PolicySummary = {
  policyId: string;
  name: string;
  description: string | null;
  scope: string;
  scopeRef: string | null;
  actionType: string;
  effect: string;
  priority: string;
  enabled: boolean;
  currentVersion: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
};

export type PolicyDetail = {
  summary: PolicySummary;
  conditions: Record<string, unknown>;
  description: string | null;
  changedBy: string | null;
  recordedAt: string | null;
};

export type PolicyVersion = {
  versionId: string;
  version: number;
  conditions: Record<string, unknown>;
  changedBy: string | null;
  recordedAt: string;
};

export type AutonomyStatus = {
  mode: 'GATED' | 'LIMITED_AUTO' | 'FULL_AUTO';
  setBy: string | null;
  setAt: string | null;
  expiresAt: string | null;
  reason: string | null;
  effectiveRules: string;
};

export type EmergencyStop = {
  active: boolean;
  reason: string | null;
  activatedBy: string | null;
  activatedAt: string | null;
  clearedBy: string | null;
  clearedAt: string | null;
};

export type HealthCheck = {
  name: string;
  status: string;
  message: string | null;
  durationMs: number;
};

export type DeepHealth = {
  status: string;
  passed: number;
  failed: number;
  durationMs: number;
  checks: HealthCheck[];
};

