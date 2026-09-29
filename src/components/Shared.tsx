import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Status({ value }: { value: string }) {
  const tone = /running|active|completed|ok|healthy|enabled/i.test(value) ? 'good' : /fail|blocked|denied|degraded|exhausted|stop/i.test(value) ? 'bad' : 'neutral';
  return <span className={`status status-${tone}`}><i />{value.replaceAll('_', ' ')}</span>;
}

export function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><header className="panel-header"><h2>{title}</h2>{action}</header>{children}</section>;
}

export function Empty({ title, detail }: { title: string; detail?: string }) {
  return <div className="empty"><strong>{title}</strong>{detail && <span>{detail}</span>}</div>;
}

export function ErrorNotice({ error }: { error: Error | null }) {
  if (!error) return null;
  return <div role="alert" className="error">{error.message}{'correlationId' in error && typeof error.correlationId === 'string' && <small>Correlation ID: {error.correlationId}</small>}</div>;
}

export function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export function DetailLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="detail-link" to={to}>{children} <span aria-hidden="true">↗</span></Link>;
}

export const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
export const date = (value: string | null) => value ? new Date(value).toLocaleString() : '—';
