import type { AuditEvent } from '../types';

export type LogLevel = 'SUCCESS' | 'FAILURE' | 'WAITING' | 'PROGRESS';

export function logLevel(event: AuditEvent): LogLevel {
  if (event.eventType === 'TASK_QUEUED_FOR_CAPACITY') return 'WAITING';
  if (event.eventType === 'MISSION_COMPLETED') return 'PROGRESS';
  if (/(FAILED|FAILURE|BLOCKED|DENIED|REJECTED|CANCELLED|TIMEOUT|EXHAUSTED)/.test(event.eventType)) return 'FAILURE';
  if (/(COMPLETED|SUCCEEDED|APPROVED|GRANTED|CLEARED|RESUMED)/.test(event.eventType)) return 'SUCCESS';
  if (/(WAITING|APPROVAL_REQUESTED|APPROVAL_REQUIRED)/.test(event.eventType)) return 'WAITING';
  return 'PROGRESS';
}

export function explainFailure(reason: string): string {
  if (/circuit open|circuit breaker.*open/i.test(reason)) return 'The planning model is temporarily unavailable after repeated failed or slow calls. The mission could not continue.';
  if (/timed? out|timeout/i.test(reason)) return 'The service did not respond within its time limit.';
  if (/tenant context required/i.test(reason)) return 'The backend could not determine the workspace for this operation.';
  return reason;
}

export function missionStage(status: string): string {
  switch (status) {
    case 'CREATED': return 'Mission saved. Execution has not started.';
    case 'PLANNING': return 'The planner is preparing a task plan. Task details appear after a valid plan is saved.';
    case 'WAITING_FOR_APPROVAL': return 'Execution is waiting for an owner decision. Open Approvals to review it.';
    case 'IN_PROGRESS': return 'Agents are executing the saved task plan.';
    case 'REVIEWING': return 'The results are being reviewed before completion.';
    case 'COMPLETED': return 'Agent report finished. Execution results are unverified.';
    case 'FAILED': return 'Execution stopped. Review the failure reason and mission logs below.';
    case 'CANCELLED': return 'The mission was cancelled.';
    default: return status.replaceAll('_', ' ');
  }
}

export function orderedEvents(events: AuditEvent[]): AuditEvent[] {
  return [...new Map(events.map(event => [event.eventId, event])).values()]
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.eventId.localeCompare(b.eventId));
}
