import { describe, expect, it } from "vitest";
import {
  ageSecondsSince,
  formatAge,
  formatChange,
  formatOnChainPrice,
  formatPrice,
  freshness,
  shorten,
} from "@/lib/format";

describe("formatPrice", () => {
  it("uses 2 decimals for large values with separators", () => {
    expect(formatPrice(3412.881)).toBe("$3,412.88");
    expect(formatPrice(67945.2)).toBe("$67,945.20");
  });

  it("uses 4 decimals for sub-$1 and near-$1 values", () => {
    expect(formatPrice(0.842)).toBe("$0.8420");
    expect(formatPrice(1.0001)).toBe("$1.0001");
  });

  it("renders a dash for non-finite input", () => {
    expect(formatPrice(Number.NaN)).toBe("—");
  });
});

describe("formatOnChainPrice", () => {
  it("scales an 8-decimal int256 decimal string", () => {
    expect(formatOnChainPrice("341288000000")).toBe("$3,412.88");
  });
  it("returns a dash when missing or non-numeric", () => {
    expect(formatOnChainPrice(undefined)).toBe("—");
    expect(formatOnChainPrice("")).toBe("—");
    expect(formatOnChainPrice("0x1f")).toBe("—");
  });

  it("keeps precision for values beyond 2^53 (BigInt path)", () => {
    // 99,999,999,999,999 USD scaled by 1e8 — exceeds Number's safe integer range.
    expect(formatOnChainPrice("9999999999999900000000")).toBe("$99,999,999,999,999.00");
  });

  it("handles sub-dollar scaled values with 4 decimals", () => {
    expect(formatOnChainPrice("84200000")).toBe("$0.8420");
  });

  it("uses 2 decimals for large magnitudes regardless of sign", () => {
    expect(formatOnChainPrice("-341288000000")).toContain("3,412.88");
    expect(formatOnChainPrice("-341288000000")).not.toContain("3,412.8800");
  });
});

describe("formatAge", () => {
  it("formats seconds, minutes, hours, days", () => {
    expect(formatAge(2)).toBe("just now");
    expect(formatAge(9)).toBe("9s");
    expect(formatAge(120)).toBe("2m");
    expect(formatAge(4320)).toBe("1h 12m");
    expect(formatAge(3600)).toBe("1h");
    expect(formatAge(90000)).toBe("1d 1h");
  });
  it("guards against negatives", () => {
    expect(formatAge(-5)).toBe("—");
  });
});

describe("ageSecondsSince", () => {
  it("computes elapsed seconds against a fixed now", () => {
    const now = Date.parse("2026-06-26T12:00:10.000Z");
    expect(ageSecondsSince("2026-06-26T12:00:00.000Z", now)).toBe(10);
  });
  it("returns NaN for missing/invalid input", () => {
    expect(Number.isNaN(ageSecondsSince(undefined))).toBe(true);
    expect(Number.isNaN(ageSecondsSince("not-a-date"))).toBe(true);
  });
});

describe("freshness", () => {
  it("buckets by age thresholds", () => {
    expect(freshness(10)).toBe("fresh");
    expect(freshness(600)).toBe("stale");
    expect(freshness(7200)).toBe("old");
    expect(freshness(-1)).toBe("old");
  });
});

describe("shorten", () => {
  it("truncates long hex", () => {
    expect(shorten("0x1234567890abcdef")).toBe("0x1234…cdef");
  });
  it("leaves short strings intact and dashes empty", () => {
    expect(shorten("0x1234")).toBe("0x1234");
    expect(shorten(undefined)).toBe("—");
  });
});

describe("formatChange", () => {
  it("adds an explicit sign", () => {
    expect(formatChange(1.84)).toBe("+1.84%");
    expect(formatChange(-2.55)).toBe("-2.55%");
  });
});
