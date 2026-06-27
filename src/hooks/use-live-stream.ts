"use client";

import { useEffect, useRef, useState } from "react";
import { env } from "@/env";
import { type AggregatedPrice, type IndexerEvent, wsMessageSchema } from "@/lib/api/schemas";

/** Resolve the browser-reachable WS base, deriving from the API URL if unset. */
export function resolveWsBase(): string {
  if (env.NEXT_PUBLIC_WS_URL) return env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
  return env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws").replace(/\/$/, "");
}

export type LiveStreamStatus = "connecting" | "open" | "closed";

type Handlers = {
  onPrice?: (price: AggregatedPrice) => void;
  onEvent?: (event: IndexerEvent) => void;
};

/**
 * Subscribe to the BFF's multiplexed `/ws/stream` (price + event frames). A
 * WebSocket is a genuine client-side realtime subscription, so a `useEffect`
 * connection is the right pattern here — initial data still comes from Server
 * Components. Reconnects with capped backoff. Handlers are read through a ref so
 * the socket is not torn down when callers pass fresh closures each render.
 */
export function useLiveStream(handlers: Handlers): LiveStreamStatus {
  const [status, setStatus] = useState<LiveStreamStatus>("connecting");
  const handlersRef = useRef(handlers);

  // Keep the latest handlers available to the socket without re-opening it.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let closedByUs = false;

    const connect = () => {
      setStatus("connecting");
      let current: WebSocket;
      try {
        current = new WebSocket(`${resolveWsBase()}/ws/stream`);
      } catch {
        scheduleReconnect();
        return;
      }
      socket = current;
      // Ignore late events from a socket we've already replaced.
      const isStale = () => socket !== current;

      current.onopen = () => {
        if (isStale()) return;
        attempt = 0;
        setStatus("open");
      };

      current.onmessage = (ev) => {
        if (isStale()) return;
        if (typeof ev.data !== "string") return;
        let raw: unknown;
        try {
          raw = JSON.parse(ev.data);
        } catch {
          return; // ignore non-JSON frames
        }
        const parsed = wsMessageSchema.safeParse(raw);
        if (!parsed.success) return; // tolerate unknown/extra frame shapes
        if (parsed.data.type === "price") handlersRef.current.onPrice?.(parsed.data.payload);
        else handlersRef.current.onEvent?.(parsed.data.payload);
      };

      current.onclose = () => {
        if (isStale()) return;
        setStatus("closed");
        if (!closedByUs) scheduleReconnect();
      };

      current.onerror = () => {
        current.close();
      };
    };

    const scheduleReconnect = () => {
      if (closedByUs) return;
      attempt += 1;
      const delay = Math.min(1000 * 2 ** Math.min(attempt, 5), 15000);
      reconnectTimer = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return status;
}
