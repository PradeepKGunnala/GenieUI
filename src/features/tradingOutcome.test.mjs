import test from 'node:test';
import assert from 'node:assert/strict';
import { tradingOutcome, progress } from './tradingOutcome.ts';
test('risk stop and unfinished liquidation are distinct from target achievement', () => {
  assert.equal(tradingOutcome('RISK_LIMIT_STOPPED'), 'Stopped · risk limit reached');
  assert.match(tradingOutcome('SHUTDOWN_PENDING'), /pending/);
  assert.equal(tradingOutcome('TARGET_ACHIEVED'), 'Target achieved');
});
test('target progress measures gain, not time remaining', () => {
  assert.equal(progress(1000,10000,1000),0);
  assert.equal(progress(1000,10000,10000),100);
  assert.equal(progress(1000,10000,4321.43),36.90477777777778);
  assert.equal(progress(1000,1000,1000),null);
});
