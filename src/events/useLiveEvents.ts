import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isTauri } from '@tauri-apps/api/core';
import { CP, parseChangeEvent } from '../api/client';
import type { ChangeEvent } from '../types';

const eventNames = ['CONNECTED', 'OPERATIONS_SUMMARY_CHANGED', 'WORKFLOW_CHANGED', 'INCIDENT_CHANGED', 'APPROVAL_CHANGED', 'AUTONOMY_CHANGED', 'EMERGENCY_STOP_ACTIVATED', 'EMERGENCY_STOP_CLEARED'];

export function useLiveEvents(enabled: boolean) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<ChangeEvent[]>([]);

  useEffect(() => {
    if (!enabled || isTauri()) return;
    const source = new EventSource(`${CP}/events`);
    const onEvent = (message: MessageEvent) => {
      const event = parseChangeEvent(message.data);
      if (!event) return;
      setConnected(true);
      if (event.type !== 'CONNECTED') {
        setEvents((current) => [event, ...current].slice(0, 30));
        void queryClient.invalidateQueries();
      }
    };
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    eventNames.forEach((name) => source.addEventListener(name, onEvent as EventListener));
    source.onmessage = onEvent;
    return () => { source.close(); setConnected(false); };
  }, [enabled, queryClient]);

  return { connected, events };
}
