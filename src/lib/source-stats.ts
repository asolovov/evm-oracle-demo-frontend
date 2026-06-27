/**
 * Pure helpers for visualizing how the aggregated median is formed from the live
 * source prices. No React, no I/O — unit-tested in source-stats.test.ts.
 */

/** Total spread across source prices as a % of the median, or null if <2 sources. */
export function sourceSpreadPct(prices: number[], median: number): number | null {
  if (prices.length < 2 || !(median > 0)) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return ((max - min) / median) * 100;
}

/** Signed deviation of a single source from the median, in %. */
export function deviationPct(price: number, median: number): number {
  if (!(median > 0) || !Number.isFinite(price)) return 0;
  return ((price - median) / median) * 100;
}

/** Each price's position in [0,1] within the [min,max] span (0.5 when all equal). */
export function normalizedPositions(prices: number[]): number[] {
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (max === min) return prices.map(() => 0.5);
  return prices.map((p) => (p - min) / (max - min));
}

/** Compact spread label for a tile, e.g. "0.04% spread" or "—". */
export function spreadLabel(prices: number[], median: number): string {
  const pct = sourceSpreadPct(prices, median);
  return pct === null ? "—" : `${pct.toFixed(2)}% spread`;
}
