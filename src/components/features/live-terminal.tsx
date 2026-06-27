"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLiveStream } from "@/hooks/use-live-stream";
import { eventToLine, priceToLine, type TerminalLine } from "@/lib/terminal-line";

const MAX_LINES = 60;

export type BootInfo = {
  reporters: number;
  threshold: number;
  block: string | null;
  assetCount: number;
};

const TONE_COLOR: Record<TerminalLine["tone"], string> = {
  price: "var(--ac)",
  requested: "#8fb8ff",
  fulfilled: "var(--good)",
  submit: "var(--fg-muted)",
  system: "var(--fg-dim)",
};

function bootLines(boot: BootInfo, connected: boolean): string[] {
  return [
    "> lighthouse oracle node v1.0.0",
    `> connect ws://node/ws/stream ... [ ${connected ? "LIVE" : "…"} ]`,
    `> reporter set ${boot.threshold}-of-${boot.reporters} ......... [ OK ]`,
    `> tracked assets ${boot.assetCount} ................ [ OK ]`,
    `> latest block ${boot.block ? `#${boot.block}` : "—"} ........ [ OK ]`,
    "> ready. watching the markets.",
  ];
}

/**
 * The landing terminal: real boot telemetry (from server props) followed by a
 * genuine live tail of the WS stream, seeded with recent submissions so it's
 * never empty. Event lines link to their request status page.
 */
export function LiveTerminal({ boot, seed }: { boot: BootInfo; seed: TerminalLine[] }) {
  const [lines, setLines] = useState<TerminalLine[]>(seed);
  const [reveal, setReveal] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const status = useLiveStream({
    onPrice: (p) => setLines((prev) => [...prev, priceToLine(p, new Date())].slice(-MAX_LINES)),
    onEvent: (e) => {
      const line = eventToLine(e, new Date());
      if (line) setLines((prev) => [...prev, line].slice(-MAX_LINES));
    },
  });

  const boots = bootLines(boot, status === "open");

  // Reveal the boot lines one at a time (honors reduced motion).
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReveal(boots.length);
      return;
    }
    const iv = setInterval(() => {
      setReveal((r) => {
        if (r >= boots.length) {
          clearInterval(iv);
          return r;
        }
        return r + 1;
      });
    }, 180);
    return () => clearInterval(iv);
  }, [boots.length]);

  // Keep the feed pinned to the newest line.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on every new line
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <div
      style={{
        border: "1px solid var(--acd)",
        background: "rgba(0,0,0,0.45)",
        boxShadow: "inset 0 0 40px -20px var(--acg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 12px",
          borderBottom: "1px solid var(--acd)",
          fontSize: 10,
          letterSpacing: "1.5px",
          color: "var(--fg-dim)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: status === "open" ? "var(--good)" : "var(--fg-dim)",
            boxShadow: status === "open" ? "0 0 6px var(--good)" : "none",
          }}
        />
        node.log — {status === "open" ? "live" : status}
      </div>

      {/* Boot telemetry (real) */}
      <pre
        style={{
          margin: 0,
          padding: "12px 16px 4px",
          fontFamily: "inherit",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#9ad6a0",
          whiteSpace: "pre-wrap",
        }}
      >
        {boots.slice(0, reveal).join("\n")}
        {reveal < boots.length ? (
          <span
            style={{
              display: "inline-block",
              width: "0.55em",
              height: "1em",
              background: "var(--ac)",
              verticalAlign: "text-bottom",
              animation: "blink 1s step-end infinite",
            }}
          />
        ) : null}
      </pre>

      {/* Live tail */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 168,
          overflowY: "auto",
          borderTop: "1px solid rgba(255,176,0,0.08)",
          padding: "8px 16px 12px",
          fontSize: 11.5,
          lineHeight: 1.7,
        }}
      >
        {lines.length === 0 ? (
          <span style={{ color: "var(--fg-dim)" }}>awaiting activity…</span>
        ) : (
          lines.map((l) => (
            <div key={l.id} style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>
              <span style={{ color: "var(--fg-faint)", flexShrink: 0 }}>{l.ts}</span>
              <span style={{ color: TONE_COLOR[l.tone], flexShrink: 0, width: 78 }}>{l.tag}</span>
              {l.reqId ? (
                <Link
                  href={`/requests/${l.reqId}`}
                  style={{
                    color: "var(--fg-muted)",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {l.text} ↗
                </Link>
              ) : (
                <span
                  style={{ color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {l.text}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
