import test from 'node:test';
import assert from 'node:assert/strict';
import { logLevel, explainFailure, missionStage, orderedEvents } from './missionLog.ts';

test('failure and waiting events are never reported as success', () => {
  for (const eventType of ['MISSION_FAILED','TASK_BLOCKED','APPROVAL_DENIED','MODEL_FALLBACK_EXHAUSTED']) assert.equal(logLevel({eventType}), 'FAILURE');
  assert.equal(logLevel({eventType:'APPROVAL_REQUESTED'}), 'WAITING');
  assert.equal(logLevel({eventType:'TASK_COMPLETED'}), 'SUCCESS');
  assert.equal(logLevel({eventType:'MISSION_PLAN_CREATED'}), 'PROGRESS');
});
test('planning copy does not claim that tasks exist', () => {
  assert.match(missionStage('PLANNING'), /after a valid plan is saved/);
  assert.match(missionStage('FAILED'), /stopped/);
});
test('model failures have readable explanations and preserve unknown reasons', () => {
  assert.match(explainFailure('circuit open for reasoning-default'), /temporarily unavailable/);
  assert.match(explainFailure('model call timed out'), /time limit/);
  assert.equal(explainFailure('Unknown backend rejection'), 'Unknown backend rejection');
});
test('overlapping log pages are deduplicated and displayed chronologically', () => {
  const old = {eventId:'a',timestamp:'2026-10-01T01:00:00Z'};
  const recent = {eventId:'b',timestamp:'2026-10-01T02:00:00Z'};
  assert.deepEqual(orderedEvents([recent,old,recent]), [old,recent]);
});
test('mission completion is a report, not proof of trading success', () => {
  assert.equal(logLevel({eventType:'MISSION_COMPLETED'}), 'PROGRESS');
  assert.match(missionStage('COMPLETED'), /unverified/);
});
