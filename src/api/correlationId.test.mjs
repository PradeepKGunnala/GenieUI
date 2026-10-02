import test from 'node:test';
import assert from 'node:assert/strict';
import { correlationId } from './correlationId.ts';
test('request tracing works without browser crypto on private HTTP origins', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  try {
    const first = correlationId();
    assert.match(first, /^ui-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    assert.notEqual(first, correlationId());
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
    else delete globalThis.crypto;
  }
});
