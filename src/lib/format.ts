/**
 * Pure presentation helpers. No React, no I/O — unit-tested in format.test.ts.
 */

/**
 * Format a USD price. Sub-$1 values and near-$1 stablecoins get 4 decimals,
 * everything else gets 2, with thousands separators. Mirrors the design's
 * decimal heuristic.
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const decimals = abs < 1 || Math.abs(abs - 1) < 0.02 ? 4 : 2;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Convert an on-chain int256 price in Chainlink 8-decimal scale (a base-10
 * decimal string) into a formatted USD price.
 */
export function formatOnChainPrice(scaled: string | undefined, decimals = 8): string {
  if (!scaled || !/^-?\d+$/.test(scaled)) return "—";
  // Split the digit string at the decimal point instead of Number(scaled)/1e8,
  // which would overflow for int256 values far beyond Number's safe range.
  const negative = scaled.startsWith("-");
  const digits = (negative ? scaled.slice(1) : scaled).padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals);
  const value = Number(`${whole}.${frac}`);
  if (!Number.isFinite(value)) return "—";
  return formatPrice(negative ? -value : value);
}

/** Compact relative age from a whole number of seconds, e.g. "9s", "2m", "1h 12m". */
export function formatAge(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins ? `${hours}h ${remMins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours ? `${days}d ${remHours}h` : `${days}d`;
}

/** Seconds elapsed since an ISO-8601 timestamp, relative to `now` (default Date.now). */
export function ageSecondsSince(iso: string | undefined, now: number = Date.now()): number {
  if (!iso) return Number.NaN;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.NaN;
  return Math.max(0, Math.floor((now - t) / 1000));
}

/** Relative age from an ISO timestamp, e.g. "12s ago" or "—" when missing. */
export function formatAgeSince(iso: string | undefined, now: number = Date.now()): string {
  const secs = ageSecondsSince(iso, now);
  if (Number.isNaN(secs)) return "—";
  return formatAge(secs);
}

/** Freshness bucket from an age in seconds. Purely informational (spec §5.3). */
export type Freshness = "fresh" | "stale" | "old";

export function freshness(ageSec: number): Freshness {
  if (!Number.isFinite(ageSec) || ageSec < 0) return "old";
  if (ageSec < 300) return "fresh"; // < 5 min
  if (ageSec < 3600) return "stale"; // < 1 h
  return "old";
}

/** Shorten a 0x address/hash to `0x1234…cdef`. */
export function shorten(hex: string | undefined, lead = 6, tail = 4): string {
  if (!hex) return "—";
  if (hex.length <= lead + tail + 1) return hex;
  return `${hex.slice(0, lead)}…${hex.slice(-tail)}`;
}
