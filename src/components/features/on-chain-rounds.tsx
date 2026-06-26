import { explorerTx } from "@/config/chain";
import type { SubmissionStatus } from "@/lib/api/schemas";
import { ageSecondsSince, formatAge, formatOnChainPrice, shorten } from "@/lib/format";

const STATUS_COLOR: Record<string, string> = {
  confirmed: "var(--good)",
  pending: "var(--ac)",
  failed: "var(--bad)",
  dropped: "var(--bad)",
  expired: "var(--fg-dim)",
};

/** Recent on-chain submissions for an asset, rendered as a rounds table. */
export function OnChainRounds({
  submissions,
  now,
}: {
  submissions: SubmissionStatus[];
  /** Reference timestamp for relative ages (ms since epoch). */
  now: number;
}) {
  return (
    <div style={{ border: "1px solid var(--acd)", background: "rgba(0,0,0,0.3)" }}>
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid var(--acd)",
          fontSize: 11,
          letterSpacing: "2px",
          color: "var(--ac)",
        }}
      >
        RECENT ON-CHAIN SUBMISSIONS
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 10,
          letterSpacing: "1px",
          color: "var(--fg-dim)",
          padding: "9px 16px",
          borderBottom: "1px solid rgba(255,176,0,0.08)",
        }}
      >
        <span style={{ flex: 1 }}>REQ</span>
        <span style={{ flex: 1, textAlign: "right" }}>PRICE</span>
        <span style={{ flex: 1.1, textAlign: "right" }}>TX</span>
        <span style={{ flex: 0.9, textAlign: "right" }}>AGE</span>
      </div>
      {submissions.length === 0 ? (
        <div style={{ padding: "16px", fontSize: 12, color: "var(--fg-dim)" }}>
          No on-chain submissions yet.
        </div>
      ) : (
        submissions.map((s, i) => {
          const reqLabel = s.req_id === "0" ? "HB" : shorten(s.req_id, 6, 4);
          const ageStr = s.submitted_at
            ? formatAge(ageSecondsSince(s.submitted_at, now))
            : s.status || "—";
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: submissions lack a stable client key; tx may be empty while pending
              key={`${s.tx_hash || s.req_id}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 12,
                padding: "11px 16px",
                borderBottom: "1px solid rgba(255,176,0,0.06)",
              }}
            >
              <span style={{ flex: 1, color: "var(--fg)" }}>
                {reqLabel}
                {s.status && s.status !== "confirmed" ? (
                  <span
                    style={{
                      color: STATUS_COLOR[s.status] ?? "var(--fg-dim)",
                      fontSize: 9.5,
                      marginLeft: 6,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {s.status.toUpperCase()}
                  </span>
                ) : null}
              </span>
              <span style={{ flex: 1, textAlign: "right", color: "var(--ac)" }}>
                {formatOnChainPrice(s.submitted_price)}
              </span>
              <span style={{ flex: 1.1, textAlign: "right" }}>
                {s.tx_hash ? (
                  <a
                    href={explorerTx(s.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--link)", textDecoration: "none" }}
                  >
                    {shorten(s.tx_hash)} ↗
                  </a>
                ) : (
                  <span style={{ color: "var(--fg-dim)" }}>—</span>
                )}
              </span>
              <span style={{ flex: 0.9, textAlign: "right", color: "var(--fg-dim)" }}>
                {ageStr}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
