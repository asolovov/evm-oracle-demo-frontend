import { describe, expect, it } from "vitest";
import {
  deviationPct,
  normalizedPositions,
  sourceSpreadPct,
  spreadLabel,
} from "@/lib/source-stats";

describe("sourceSpreadPct", () => {
  it("computes the spread as a % of the median", () => {
    expect(sourceSpreadPct([99, 101], 100)).toBeCloseTo(2);
  });
  it("returns null for <2 sources or non-positive median", () => {
    expect(sourceSpreadPct([100], 100)).toBeNull();
    expect(sourceSpreadPct([99, 101], 0)).toBeNull();
  });
});

describe("deviationPct", () => {
  it("returns signed deviation from the median", () => {
    expect(deviationPct(101, 100)).toBeCloseTo(1);
    expect(deviationPct(99, 100)).toBeCloseTo(-1);
  });
  it("is 0 for a non-positive median", () => {
    expect(deviationPct(100, 0)).toBe(0);
  });
});

describe("normalizedPositions", () => {
  it("maps prices into [0,1] across the span", () => {
    expect(normalizedPositions([10, 20, 30])).toEqual([0, 0.5, 1]);
  });
  it("centers all points when prices are equal", () => {
    expect(normalizedPositions([5, 5, 5])).toEqual([0.5, 0.5, 0.5]);
  });
  it("handles the empty case", () => {
    expect(normalizedPositions([])).toEqual([]);
  });
});

describe("spreadLabel", () => {
  it("formats a spread", () => {
    expect(spreadLabel([99, 101], 100)).toBe("2.00% spread");
  });
  it("dashes a single source", () => {
    expect(spreadLabel([100], 100)).toBe("—");
  });
});
