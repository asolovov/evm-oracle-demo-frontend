import type { SourceContribution } from "@/lib/api/schemas";
import { formatAge, formatPrice } from "@/lib/format";

/** Per-source price breakdown table for the drill-down view. Presentational. */
export function SourceBreakdown({ sources }: { sources: SourceContribution[] }) {
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
        PER-SOURCE BREAKDOWN
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
        <span style={{ flex: 1.6 }}>SOURCE</span>
        <span style={{ flex: 1, textAlign: "right" }}>PRICE</span>
        <span style={{ flex: 0.7, textAlign: "right" }}>AGE</span>
        <span style={{ flex: 0.8, textAlign: "right" }}>USED</span>
      </div>
      {sources.length === 0 ? (
        <div style={{ padding: "16px", fontSize: 12, color: "var(--fg-dim)" }}>
          No sources reported.
        </div>
      ) : (
        sources.map((s) => (
          <div
            key={s.source}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 12,
              padding: "11px 16px",
              borderBottom: "1px solid rgba(255,176,0,0.06)",
            }}
          >
            <span style={{ flex: 1.6, color: "var(--fg)", letterSpacing: "0.5px" }}>
              {s.source.replace(/_/g, " ").toUpperCase()}
            </span>
            <span style={{ flex: 1, textAlign: "right", color: "var(--ac)" }}>
              {formatPrice(s.price)}
            </span>
            <span style={{ flex: 0.7, textAlign: "right", color: "var(--fg-muted)" }}>
              {formatAge(s.age_sec)}
            </span>
            <span style={{ flex: 0.8, textAlign: "right" }}>
              {s.included ? (
                <span style={{ color: "var(--good)" }}>✓ IN</span>
              ) : (
                <span style={{ color: "var(--bad)" }}>✕ OUT</span>
              )}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
