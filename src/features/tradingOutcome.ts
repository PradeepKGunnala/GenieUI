export const outcomeLabels: Record<string, string> = {
  AWAITING_RESEARCH_APPROVAL: 'Awaiting research-plan approval', AWAITING_BACKTEST: 'Ready for backtest',
  AWAITING_BACKTEST_APPROVAL: 'Awaiting backtest approval', READY_TO_START: 'Approved · ready to start',
  RUNNING_SIMULATION: 'Running simulation', DATA_OR_EXECUTION_HOLD: 'Paused · data or execution unavailable',
  OWNER_PAUSED: 'Paused by owner', SHUTDOWN_PENDING: 'Shutdown pending · verify positions and orders',
  TARGET_ACHIEVED: 'Target achieved', DEADLINE_REACHED: 'Ended · deadline reached',
  OWNER_STOPPED: 'Stopped by owner', RISK_LIMIT_STOPPED: 'Stopped · risk limit reached',
};
export function tradingOutcome(code: string): string { return outcomeLabels[code] ?? code.replaceAll('_', ' '); }
export function progress(initial: number, target: number, equity: number): number | null {
  return target > initial ? (equity - initial) / (target - initial) * 100 : null;
}
