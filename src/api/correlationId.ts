/** Request tracing only; never used for authentication. */
export function correlationId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return `ui-${globalThis.crypto.randomUUID()}`;
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    return `ui-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return `ui-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}
