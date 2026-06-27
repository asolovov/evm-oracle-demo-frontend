import type { SourceContribution } from "@/lib/api/schemas";
import { formatAge, formatPrice } from "@/lib/format";
import { deviationPct, normalizedPositions } from "@/lib/source-stats";

function fmtDev(d: number): string {
  return `${d >= 0 ? "+" : ""}${d.toFixed(2)}%`;
}

/**
 * How the aggregated median is formed from the live sources. A horizontal price
 * axis plots each source around the median marker; the table below carries each
 * source's price, deviation-from-median, age, and whether it was included. All
 * real, live data — the honest replacement for the old synthetic chart.
 */
export function SourceComposition({
  sources,
  median,
}: {
  sources: SourceContribution[];
  median: number;
}) {
  const prices = sources.map((s) => s.price);
  const positions = normalizedPositions(prices);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const medianPos = max === min ? 0.5 : Math.min(1, Math.max(0, (median - min) / (max - min)));

  return (
    <div
      style={{ border: "1px solid var(--acd)", background: "rgba(0,0,0,0.3)", marginBottom: 26 }}
    >
      <div
        style={{
          padding: "13px 16px",
          borderBottom: "1px solid var(--acd)",
          fontSize: 11,
          letterSpacing: "2px",
          color: "var(--ac)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>SOURCE COMPOSITION</span>
        <span style={{ color: "var(--fg-dim)", letterSpacing: "1px" }}>
          median of {sources.filter((s) => s.included).length}/{sources.length} sources
        </span>
      </div>

      {sources.length === 0 ? (
        <div style={{ padding: 16, fontSize: 12, color: "var(--fg-dim)" }}>
          No sources reported.
        </div>
      ) : (
        <>
          {/* Price axis: each source as a dot, the median as a glowing marker. */}
          <div style={{ padding: "26px 22px 18px" }}>
            <div style={{ position: "relative", height: 26 }}>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: "var(--acd)",
                }}
              />
              {/* median marker */}
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  bottom: -2,
                  left: `${medianPos * 100}%`,
                  width: 2,
                  marginLeft: -1,
                  background: "var(--ac)",
                  boxShadow: "0 0 8px var(--acg)",
                }}
              />
              {positions.map((p, i) => {
                const s = sources[i];
                if (!s) return null;
                const color = s.included ? "var(--good)" : "var(--bad)";
                return (
                  <span
                    key={s.source}
                    title={`${s.source}: ${formatPrice(s.price)}`}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: `${p * 100}%`,
                      width: 9,
                      height: 9,
                      marginLeft: -4.5,
                      marginTop: -4.5,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 7px ${color}`,
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--fg-dim)",
                marginTop: 8,
              }}
            >
              <span>{formatPrice(min)}</span>
              <span style={{ color: "var(--ac)" }}>median {formatPrice(median)}</span>
              <span>{formatPrice(max)}</span>
            </div>
          </div>

          {/* Per-source detail rows */}
          <div
            style={{
              display: "flex",
              fontSize: 10,
              letterSpacing: "1px",
              color: "var(--fg-dim)",
              padding: "9px 16px",
              borderTop: "1px solid rgba(255,176,0,0.08)",
              borderBottom: "1px solid rgba(255,176,0,0.08)",
            }}
          >
            <span style={{ flex: 1.6 }}>SOURCE</span>
            <span style={{ flex: 1, textAlign: "right" }}>PRICE</span>
            <span style={{ flex: 0.9, textAlign: "right" }}>Δ MEDIAN</span>
            <span style={{ flex: 0.7, textAlign: "right" }}>AGE</span>
            <span style={{ flex: 0.7, textAlign: "right" }}>USED</span>
          </div>
          {sources.map((s) => (
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
              <span style={{ flex: 0.9, textAlign: "right", color: "var(--fg-muted)" }}>
                {fmtDev(deviationPct(s.price, median))}
              </span>
              <span style={{ flex: 0.7, textAlign: "right", color: "var(--fg-muted)" }}>
                {formatAge(s.age_sec)}
              </span>
              <span style={{ flex: 0.7, textAlign: "right" }}>
                {s.included ? (
                  <span style={{ color: "var(--good)" }}>✓ IN</span>
                ) : (
                  <span style={{ color: "var(--bad)" }}>✕ OUT</span>
                )}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
