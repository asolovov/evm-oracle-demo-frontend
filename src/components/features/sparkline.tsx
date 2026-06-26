import { pathGeometry, RANGE_VOL, synthSeries } from "@/lib/chart";

/**
 * Small decorative trend sparkline. Seeded deterministically from the asset id —
 * the BFF has no price-history feed in v1 (history RPC returns 501), so this is
 * an illustrative shape, not real data. No axes or numbers are shown.
 */
export function Sparkline({ seed, base }: { seed: string; base: number }) {
  const w = 130;
  const h = 34;
  const vals = synthSeries(seed, 24, RANGE_VOL["24h"] * 2, base || 1);
  const { line, area } = pathGeometry(vals, w, h);
  const gradientId = `spark-${seed.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 34, display: "block" }}
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ac)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--ac)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--ac)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />
    </svg>
  );
}
