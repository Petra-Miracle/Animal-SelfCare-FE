"use client";

/* Hook SSE: berlangganan GET {API_BASE}/realtime/stream via EventSource bawaan browser.
   Backend mem-broadcast: report:created, report:classified, report:offered,
   report:claimed, report:released, report:claim_expired, report:status_changed, notification.
   Hook ini hanya menyalurkan event; keputusan refresh ada di masing-masing halaman. */

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./api";

export const REPORT_EVENTS = [
  "report:created",
  "report:classified",
  "report:offered",
  "report:claimed",
  "report:released",
  "report:claim_expired",
  "report:status_changed",
] as const;

export type RealtimeEventName = (typeof REPORT_EVENTS)[number] | "notification" | "connected";

export interface RealtimeEvent {
  name: RealtimeEventName;
  data: Record<string, unknown>;
}

export function useRealtime(onEvent?: (ev: RealtimeEvent) => void, enabled = true): {
  connected: boolean;
} {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof EventSource === "undefined") return;

    let es: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const subscribe = (source: EventSource) => {
      const names: string[] = [...REPORT_EVENTS, "notification", "connected"];
      for (const name of names) {
        source.addEventListener(name, ((e: MessageEvent) => {
          let data: Record<string, unknown> = {};
          try {
            data = e.data ? (JSON.parse(e.data) as Record<string, unknown>) : {};
          } catch {
            data = {};
          }
          if (name === "connected") {
            setConnected(true);
            attempts = 0;
            return;
          }
          handlerRef.current?.({ name: name as RealtimeEventName, data });
        }) as EventListener);
      }
    };

    const connect = () => {
      if (closed) return;
      try {
        es = new EventSource(`${API_BASE}/realtime/stream`);
      } catch {
        scheduleRetry();
        return;
      }
      subscribe(es);
      es.onerror = () => {
        setConnected(false);
        try {
          es?.close();
        } catch {
          /* abaikan */
        }
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      if (closed) return;
      attempts += 1;
      const delay = Math.min(1000 * 2 ** Math.min(attempts, 5), 30000);
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      try {
        es?.close();
      } catch {
        /* abaikan */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { connected };
}

/** Mengambil id laporan dari payload event yang bentuknya longgar. */
export function eventReportId(data: Record<string, unknown>): string | null {
  const v = data.reportId ?? data.id;
  return typeof v === "string" ? v : null;
}
