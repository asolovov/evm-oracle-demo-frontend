"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRequestStatusAction } from "@/app/requests/[reqId]/_actions/get-request-status";
import { explorerTx } from "@/config/chain";
import type { RequestSummary } from "@/lib/api/schemas";
import { formatOnChainPrice, shorten } from "@/lib/format";

const POLL_MS = 5000;

type StepState = "done" | "active" | "idle";

function isTerminal(status: string): boolean {
  return status === "fulfilled" || status === "failed";
}

function statusLabel(summary: RequestSummary | null): string {
  if (!summary) return "AWAITING INDEXER";
  if (summary.status === "fulfilled") return "FULFILLED";
  if (summary.status === "failed") return "FAILED";
  return "PENDING";
}

/** Derive the three-step timeline state from the current summary. */
function steps(summary: RequestSummary | null): { label: string; sub: string; state: StepState }[] {
  const requested = summary !== null;
  const fulfilled = summary?.status === "fulfilled";
  const failed = summary?.status === "failed";
  return [
    {
      label: "REQUESTED",
      sub: "requestPrice tx observed on-chain",
      state: requested ? "done" : "active",
    },
    {
      label: "PROCESSING",
      sub: "reporters signing · awaiting fulfilment",
      state: fulfilled || failed ? "done" : requested ? "active" : "idle",
    },
    {
      label: failed ? "FAILED" : "FULFILLED",
      sub: failed ? "fulfilment reverted" : "price written on-chain",
      state: fulfilled || failed ? "done" : "idle",
    },
  ];
}

function Timeline({ summary }: { summary: RequestSummary | null }) {
  const items = steps(summary);
  return (
    <div
      style={{
        border: "1px solid var(--acd)",
        background: "rgba(0,0,0,0.4)",
        padding: "8px 22px",
        marginBottom: 24,
        boxShadow: "inset 0 0 50px -28px var(--acg)",
      }}
    >
      {items.map((s, i) => {
        const lit = s.state !== "idle";
        const color = lit ? "var(--ac)" : "rgba(255,255,255,0.22)";
        const icon = s.state === "done" ? "✓" : s.state === "active" ? "▸" : "○";
        return (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "12px 0",
              borderBottom: i < items.length - 1 ? "1px solid rgba(255,176,0,0.08)" : "none",
              opacity: lit ? 1 : 0.55,
            }}
          >
            <span
              style={{
                width: 24,
                textAlign: "center",
                color,
                fontWeight: 700,
                fontSize: 15,
                filter: lit ? `drop-shadow(0 0 6px ${color})` : "none",
                animation: s.state === "active" ? "pulseDot 1s infinite" : "none",
              }}
            >
              {icon}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span
                  style={{
                    color: lit ? "var(--fg)" : "var(--fg-dim)",
                    letterSpacing: "2.5px",
                    fontSize: 13,
                    fontWeight: lit ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
                {s.state === "active" ? (
                  <span
                    style={{
                      color,
                      fontSize: 11,
                      letterSpacing: "1px",
                      animation: "blink 1.1s infinite",
                    }}
                  >
                    …processing
                  </span>
                ) : null}
                {s.state === "done" ? (
                  <span style={{ color: "var(--good)", fontSize: 11, letterSpacing: "1px" }}>
                    done
                  </span>
                ) : null}
              </div>
              <span style={{ color: "var(--fg-dim)", fontSize: 11, letterSpacing: "0.5px" }}>
                {s.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailCell({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-tile)", padding: "15px 17px" }}>
      <div
        style={{ fontSize: 10, letterSpacing: "1.5px", color: "var(--fg-dim)", marginBottom: 6 }}
      >
        {k}
      </div>
      <div style={{ fontSize: 14, color: "var(--fg)" }}>{children}</div>
    </div>
  );
}

function TxLink({ hash }: { hash: string | undefined }) {
  if (!hash) return <span style={{ color: "var(--fg-dim)" }}>— pending —</span>;
  return (
    <a
      href={explorerTx(hash)}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "var(--link)", textDecoration: "none" }}
    >
      {shorten(hash)} ↗
    </a>
  );
}

/**
 * Live request status view. Hydrates from the server-fetched summary, then polls
 * every 5s until the request reaches a terminal state.
 */
export function RequestStatus({
  reqId,
  initial,
}: {
  reqId: string;
  initial: RequestSummary | null;
}) {
  const [summary, setSummary] = useState<RequestSummary | null>(initial);
  const [polling, setPolling] = useState(!(initial && isTerminal(initial.status)));
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await getRequestStatusAction({ reqId });
        if (cancelled) return;
        const data = res?.data;
        if (data) {
          setSummary(data);
          setPollError(null);
          if (isTerminal(data.status)) setPolling(false);
        }
      } catch {
        // Transient fetch failure — keep polling, just surface a hint.
        if (!cancelled) setPollError("connection hiccup — retrying…");
      }
    };
    const iv = setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [reqId, polling]);

  const fulfilled = summary?.status === "fulfilled";
  const failed = summary?.status === "failed";
  const symbol = summary?.asset_id ? summary.asset_id.toUpperCase() : "—";

  const backStyle = {
    display: "inline-block",
    fontSize: 12,
    letterSpacing: "1.5px",
    marginBottom: 22,
    border: "none",
    padding: 0,
  } as const;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {summary?.asset_id ? (
        <Link href={`/assets/${summary.asset_id}`} className="lh-nav" style={backStyle}>
          ← cd ../{symbol}
        </Link>
      ) : (
        <Link href="/" className="lh-nav" style={backStyle}>
          ← cd ../dashboard
        </Link>
      )}

      <div style={{ fontSize: 11, letterSpacing: "2px", color: "var(--fg-dim)", marginBottom: 8 }}>
        {"REQUEST // requestPrice("}
        {symbol})
      </div>
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: "clamp(24px,4vw,38px)",
          fontWeight: 800,
          letterSpacing: "1.5px",
          color: failed ? "var(--bad)" : "var(--ac)",
          textShadow: failed ? "none" : "0 0 14px var(--acg)",
        }}
      >
        {statusLabel(summary)}
      </h1>
      <div
        style={{ fontSize: 12, color: "var(--fg-dim)", letterSpacing: "0.5px", marginBottom: 6 }}
      >
        reqId <span style={{ color: "var(--fg)" }}>{reqId}</span>
      </div>
      <div style={{ fontSize: 11, color: "#9ad6a0", letterSpacing: "0.5px", marginBottom: 28 }}>
        <span style={{ opacity: 0.7 }}>
          GET /api/v1/requests/{reqId} — {polling ? "polling every 5s" : "settled"}
        </span>
        {polling ? (
          <span style={{ animation: "blink 1s step-end infinite", color: "var(--ac)" }}> ▮</span>
        ) : null}
        {pollError ? (
          <span style={{ color: "var(--bad)", marginLeft: 8 }}>· {pollError}</span>
        ) : null}
      </div>

      <Timeline summary={summary} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 1,
          background: "var(--acd)",
          border: "1px solid var(--acd)",
        }}
      >
        <DetailCell k="ASSET">{symbol} / USD</DetailCell>
        <DetailCell k="REQUESTER">
          {summary?.requester ? shorten(summary.requester) : "—"}
        </DetailCell>
        <DetailCell k="REQUEST TX">
          <TxLink hash={summary?.requested_tx_hash} />
        </DetailCell>
        <DetailCell k="FULFILLMENT TX">
          <TxLink hash={summary?.fulfilled_tx_hash} />
        </DetailCell>
      </div>

      <div
        style={{
          border: "1px solid var(--acd)",
          borderTop: "none",
          background: "rgba(0,0,0,0.4)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{ fontSize: 10, letterSpacing: "2px", color: "var(--fg-dim)", marginBottom: 10 }}
        >
          FINAL WRITTEN PRICE
        </div>
        <div
          style={{
            fontSize: "clamp(30px,6vw,52px)",
            fontWeight: 800,
            color: fulfilled ? "var(--good)" : "var(--fg-dim)",
            textShadow: fulfilled ? "0 0 18px rgba(84,224,138,0.5)" : "none",
            animation: !fulfilled && !failed ? "blink 1.2s infinite" : "none",
          }}
        >
          {fulfilled ? formatOnChainPrice(summary?.fulfilled_price) : "— pending —"}
        </div>
      </div>
    </div>
  );
}
