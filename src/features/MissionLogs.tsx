import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, RefreshCw, Terminal } from 'lucide-react';
import { api } from '../api/client';
import { date, ErrorNotice } from '../components/Shared';
import type { MissionDetail } from '../types';
import { explainFailure, logLevel, missionStage, orderedEvents } from './missionLog';

export function MissionLogs({ missionId, mission }: { missionId: string; mission?: MissionDetail }) {
  const [open, setOpen] = useState(true);
  const audit = useInfiniteQuery({
    queryKey: ['mission-log', missionId],
    queryFn: ({ pageParam }) => api.audit(missionId, pageParam),
    initialPageParam: 0,
    getNextPageParam: page => page.page + 1 < page.totalPages ? page.page + 1 : undefined,
    enabled: !!missionId,
    refetchInterval: 3000,
  });
  const events = orderedEvents(audit.data?.pages.flatMap(page => page.items) ?? []);
  const successes = events.filter(event => logLevel(event) === 'SUCCESS').length;
  const failures = events.filter(event => logLevel(event) === 'FAILURE').length;
  const lastUpdate = audit.dataUpdatedAt ? new Date(audit.dataUpdatedAt).toLocaleTimeString() : 'Waiting for updates';
  return <section className="mission-console" aria-label="Mission logs">
    <header className="mission-console-header">
      <button className="mission-console-toggle" aria-expanded={open} aria-controls="mission-console-output" onClick={() => setOpen(!open)}><Terminal size={17} /> Mission logs {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
      <span className="console-counts">{successes} success events · {failures} failure events</span>
      <button className="icon-button" aria-label="Refresh mission logs" disabled={audit.isFetching} onClick={() => void audit.refetch()}><RefreshCw size={16} /></button>
    </header>
    {open && <div id="mission-console-output">
      <div className="mission-console-status" role="status">{audit.isError ? 'Log connection unavailable' : `Updated ${lastUpdate} · refreshes every 3 seconds`}</div>
      <ErrorNotice error={audit.error} />
      <div className="mission-console-lines" role="region" aria-label="Timestamped mission events" tabIndex={0}>
        {audit.hasNextPage && <button className="secondary" disabled={audit.isFetchingNextPage} onClick={() => void audit.fetchNextPage()}>{audit.isFetchingNextPage ? 'Loading…' : 'Load older events'}</button>}
        {mission && <div className="console-line"><time>{date(mission.createdAt)}</time><span className="console-level console-progress">SAVED</span><div>Mission saved: {mission.title}</div></div>}
        {events.map(event => <div className="console-line" key={event.eventId}><time>{date(event.timestamp)}</time><span className={`console-level console-${logLevel(event).toLowerCase()}`}>{logLevel(event)}</span><div><span>{event.eventType === 'MISSION_COMPLETED' ? 'Agent report finished · execution results unverified' : event.summary || event.eventType.replaceAll('_', ' ')}</span>{event.actor && <small>Actor: {event.actor}</small>}<details><summary>Event details</summary><code>{event.eventType}</code>{event.correlationId && <small>Correlation ID: {event.correlationId}</small>}{Object.keys(event.metadata ?? {}).length > 0 && <pre>{JSON.stringify(event.metadata, null, 2)}</pre>}</details></div></div>)}
        {mission && <div className="console-line"><time>{date(mission.updatedAt)}</time><span className={`console-level console-${mission.status === 'FAILED' ? 'failure' : 'progress'}`}>STATE</span><div>{missionStage(mission.status)}{mission.failureReason && <><p>{explainFailure(mission.failureReason)}</p><code>{mission.failureReason}</code></>}</div></div>}
        {!mission && !events.length && <p>{audit.isPending ? 'Loading mission events…' : 'No mission events available.'}</p>}
      </div>
    </div>}
  </section>;
}
