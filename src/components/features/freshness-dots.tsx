import { type Freshness, freshness } from "@/lib/format";

const COLOR: Record<Freshness, string> = {
  fresh: "var(--good)",
  stale: "var(--ac)",
  old: "var(--bad)",
};

/**
 * One pulsing dot per source, colored by freshness (green/amber/red). Purely
 * informational — ages never gate in demo mode (spec §5.3). `ages` is a list of
 * per-source ages in seconds.
 */
export function FreshnessDots({ ages, animate = true }: { ages: number[]; animate?: boolean }) {
  if (ages.length === 0) {
    return <span style={{ fontSize: 10, color: "var(--fg-dim)" }}>NO SRC</span>;
  }
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {ages.map((age, i) => {
        const color = COLOR[freshness(age)];
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: dots are positional and have no stable id
            key={i}
            title={`source ${i + 1}: ${freshness(age)}`}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 7px ${color}`,
              animation: animate ? "pulseDot 2.4s infinite" : "none",
              animationDelay: `${i * 0.3}s`,
            }}
          />
        );
      })}
    </span>
  );
}
