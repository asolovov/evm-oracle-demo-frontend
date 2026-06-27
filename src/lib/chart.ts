/**
 * Deterministic synthetic price series + SVG path geometry. Pure, unit-tested.
 *
 * The API exposes no price-history endpoint, so the drill-down chart renders an
 * *illustrative* series seeded from the asset id (stable across renders). The UI
 * labels it as a synthetic preview; it must never be presented as real history.
 */

/** FNV-1a hash → unsigned 32-bit, for stable per-asset seeding. */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable pseudo-random walk of length `n` around `base` with volatility `vol`. */
export function synthSeries(seed: string, n: number, vol: number, base: number): number[] {
  let h = hashSeed(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    h = (Math.imul(h, 1103515245) + 12345) & 0x7fffffff;
    const r = h / 0x7fffffff - 0.5;
    v = v * (1 + r * vol);
    out.push(v);
  }
  return out;
}

export type ChartRange = "24h" | "7d" | "30d";

export const RANGE_POINTS: Record<ChartRange, number> = { "24h": 48, "7d": 56, "30d": 60 };
export const RANGE_VOL: Record<ChartRange, number> = { "24h": 0.012, "7d": 0.03, "30d": 0.06 };
export const RANGE_X_LABELS: Record<ChartRange, string[]> = {
  "24h": ["-24h", "-18h", "-12h", "-6h", "now"],
  "7d": ["-7d", "-5d", "-3d", "-1d", "now"],
  "30d": ["-30d", "-23d", "-15d", "-7d", "now"],
};

export type ChartGeometry = {
  line: string;
  area: string;
  lastX: number;
  lastY: number;
};

/** Build SVG `path` `d` strings for a line + filled area over a w×h viewBox. */
export function pathGeometry(vals: number[], w: number, h: number): ChartGeometry {
  const n = vals.length;
  if (n === 0) return { line: "", area: "", lastX: 0, lastY: h };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = (max - min) * 0.18 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const x = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * w);
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const line = `M${vals.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" L ")}`;
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return { line, area, lastX: x(n - 1), lastY: y(vals[n - 1] ?? 0) };
}
