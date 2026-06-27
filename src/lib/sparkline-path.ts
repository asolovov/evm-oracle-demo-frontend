/**
 * Minimal SVG path geometry for a small line over a w×h viewBox. Used by the
 * real on-chain-rounds step-line (the only legit time-series we have). Pure.
 */
export type LinePath = { line: string; area: string };

export function linePath(values: number[], w: number, h: number): LinePath {
  if (values.length === 0) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.18 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const n = values.length;
  const x = (i: number) => (n === 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const line = `M${values.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" L ")}`;
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h} L ${x(0).toFixed(1)} ${h} Z`;
  return { line, area };
}
