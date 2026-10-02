export function fmtMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `$${Number(value).toFixed(2)}`;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
}

export function fmtDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${(value * 100).toFixed(0)}%`;
}

