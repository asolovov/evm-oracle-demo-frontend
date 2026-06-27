import type { OnChainRound } from "@/lib/chain/reads";
import { formatAge, formatOnChainPrice } from "@/lib/format";
import { linePath } from "@/lib/sparkline-path";

/**
 * Real on-chain rounds read straight from the aggregator (`getRoundData`). Sparse
 * by nature (a round per fulfilment) — the only legitimate time-series we have.
 * Rounds carry round IDs (not request IDs), so there's no /requests link here.
 */
export function OnChainRoundsChain({
  rounds,
  decimals,
  now,
}: {
  rounds: OnChainRound[];
  decimals: number;
  now: number;
}) {
  // Step-line over the real answers, oldest → newest (rounds arrive newest-first).
  const ordered = [...rounds].reverse();
  const w = 280;
  const h = 40;
  const { line, area } = linePath(
    ordered.map((r) => Number(r.answer)),
    w,
    h,
  );

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
        ON-CHAIN ROUNDS
      </div>

      {rounds.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12, color: "var(--fg-dim)" }}>
          No on-chain rounds yet.
        </div>
      ) : (
        <>
          {ordered.length >= 2 ? (
            <div style={{ padding: "14px 16px 4px" }}>
              <svg
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                style={{ width: "100%", height: 40, display: "block" }}
                role="img"
                aria-label="on-chain round answers"
              >
                <defs>
                  <linearGradient id="rounds-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ac)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--ac)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#rounds-fill)" />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--ac)"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ) : null}

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
            <span style={{ flex: 1 }}>ROUND</span>
            <span style={{ flex: 1, textAlign: "right" }}>ANSWER</span>
            <span style={{ flex: 0.9, textAlign: "right" }}>AGE</span>
          </div>
          {rounds.map((r) => {
            const ageSec = Math.max(0, Math.floor(now / 1000) - Number(r.updatedAt));
            return (
              <div
                key={r.roundId.toString()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 12,
                  padding: "11px 16px",
                  borderBottom: "1px solid rgba(255,176,0,0.06)",
                }}
              >
                <span style={{ flex: 1, color: "var(--fg)" }}>#{r.roundId.toString()}</span>
                <span style={{ flex: 1, textAlign: "right", color: "var(--ac)" }}>
                  {formatOnChainPrice(r.answer.toString(), decimals)}
                </span>
                <span style={{ flex: 0.9, textAlign: "right", color: "var(--fg-dim)" }}>
                  {formatAge(ageSec)}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
