import { resolveAsset } from "@/config/contracts";
import type { AggregatedPrice, IndexerEvent, SubmissionStatus } from "@/lib/api/schemas";
import { formatOnChainPrice, formatPrice, shorten } from "@/lib/format";

/**
 * Pure builders that turn real BFF/WS data into terminal-feed lines for the
 * landing page. No React, no I/O — unit-tested. `reqId` (when present) is the
 * canonical link target; the renderer builds a typed `/requests/${reqId}` href.
 */
export type LineTone = "price" | "requested" | "fulfilled" | "submit" | "system";

export type TerminalLine = {
  id: string;
  ts: string;
  tag: string;
  text: string;
  /** Numeric consumer request id → links to /requests/[reqId]. */
  reqId?: string;
  tone: LineTone;
};

/** HH:MM:SS (UTC) for a terminal timestamp. */
export function hms(d: Date): string {
  return d.toISOString().slice(11, 19);
}

function sym(assetId: string): string {
  return resolveAsset(assetId)?.symbol ?? assetId.toUpperCase();
}

function consumerReqId(reqId: string): string | undefined {
  return reqId !== "0" && /^\d+$/.test(reqId) ? reqId : undefined;
}

/** A recent oracle submission (the seed source). No round_id / requester here. */
export function submissionToLine(s: SubmissionStatus): TerminalLine {
  const reqId = consumerReqId(s.req_id);
  const who = reqId ? `req#${s.req_id}` : "heartbeat";
  return {
    id: `sub-${s.tx_hash || s.req_id}-${s.submitted_at ?? ""}`,
    ts: s.submitted_at ? hms(new Date(s.submitted_at)) : "--:--:--",
    tag: "SUBMIT",
    text: `${sym(s.asset_id)} ${formatOnChainPrice(s.submitted_price)} ${s.status} ${who}`,
    ...(reqId ? { reqId } : {}),
    tone: "submit",
  };
}

/** A live aggregated-price frame. */
export function priceToLine(p: AggregatedPrice, now: Date): TerminalLine {
  return {
    id: `price-${p.asset_id}-${p.aggregated_at}`,
    ts: hms(now),
    tag: "PRICE",
    text: `${sym(p.asset_id)} ${formatPrice(p.median_price)} · median of ${p.sources.length} src`,
    tone: "price",
  };
}

/** A live chain event. Returns null for kinds we don't surface. */
export function eventToLine(e: IndexerEvent, now: Date): TerminalLine | null {
  if (e.kind === "PRICE_REQUESTED" && e.price_requested) {
    const r = e.price_requested;
    const reqId = consumerReqId(r.req_id);
    return {
      id: `req-${r.req_id}-${e.meta?.tx_hash ?? ""}`,
      ts: hms(now),
      tag: "REQUESTED",
      text: `${sym(r.asset_id)} by ${shorten(r.requester)} req#${r.req_id}`,
      ...(reqId ? { reqId } : {}),
      tone: "requested",
    };
  }
  if (e.kind === "PRICE_FULFILLED" && e.price_fulfilled) {
    const f = e.price_fulfilled;
    const reqId = consumerReqId(f.req_id);
    const round = f.round_id ? ` round#${f.round_id}` : "";
    return {
      id: `ful-${f.req_id}-${e.meta?.tx_hash ?? ""}`,
      ts: hms(now),
      tag: "FULFILLED",
      text: `${sym(f.asset_id)} ${formatOnChainPrice(f.price)}${round} req#${f.req_id}`,
      ...(reqId ? { reqId } : {}),
      tone: "fulfilled",
    };
  }
  if (e.kind === "ASSET_REGISTERED" && e.asset_registered) {
    const a = e.asset_registered;
    return {
      id: `reg-${a.asset_id}`,
      ts: hms(now),
      tag: "REGISTERED",
      text: `${sym(a.asset_id)} → ${shorten(a.aggregator)}`,
      tone: "system",
    };
  }
  return null;
}
