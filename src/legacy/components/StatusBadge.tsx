const TONE: Record<string, string> = {
  // green
  COMPLETED: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  APPROVED: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  ACTIVE: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  OK: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  NORMAL: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  UP: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  ENABLED: 'text-emerald-300 border-emerald-700 bg-emerald-950/50',
  // blue
  IN_PROGRESS: 'text-sky-300 border-sky-700 bg-sky-950/50',
  ASSIGNED: 'text-sky-300 border-sky-700 bg-sky-950/50',
  PLANNING: 'text-sky-300 border-sky-700 bg-sky-950/50',
  REVIEWING: 'text-sky-300 border-sky-700 bg-sky-950/50',
  STARTED: 'text-sky-300 border-sky-700 bg-sky-950/50',
  IDLE: 'text-sky-300 border-sky-700 bg-sky-950/50',
  // amber
  PENDING: 'text-amber-300 border-amber-700 bg-amber-950/50',
  WAITING_FOR_APPROVAL: 'text-amber-300 border-amber-700 bg-amber-950/50',
  WARNING: 'text-amber-300 border-amber-700 bg-amber-950/50',
  DEGRADED: 'text-amber-300 border-amber-700 bg-amber-950/50',
  READY: 'text-amber-300 border-amber-700 bg-amber-950/50',
  CREATED: 'text-amber-300 border-amber-700 bg-amber-950/50',
  // red
  FAILED: 'text-red-300 border-red-700 bg-red-950/50',
  DENIED: 'text-red-300 border-red-700 bg-red-950/50',
  EXHAUSTED: 'text-red-300 border-red-700 bg-red-950/50',
  GLOBAL_KILL_SWITCH:
    'text-red-300 border-red-700 bg-red-950/50 font-semibold',
  AGENT_KILL_SWITCH: 'text-red-300 border-red-700 bg-red-950/50',
  EMERGENCY_STOP: 'text-red-300 border-red-700 bg-red-950/50 font-semibold',
  DOWN: 'text-red-300 border-red-700 bg-red-950/50',
  // slate
  CANCELLED: 'text-slate-400 border-slate-600 bg-slate-800/50',
  CONFIG_DISABLED: 'text-slate-400 border-slate-600 bg-slate-800/50',
  DISABLED: 'text-slate-400 border-slate-600 bg-slate-800/50',
  BLOCKED: 'text-slate-400 border-slate-600 bg-slate-800/50',
};

/** Color + text badge — status is never color-only. */
export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = status ?? 'UNKNOWN';
  const tone =
    TONE[key] ?? 'text-slate-300 border-line bg-panel';
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs ${tone}`}
    >
      {key.replaceAll('_', ' ')}
    </span>
  );
}

