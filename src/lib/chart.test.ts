import { describe, expect, it } from "vitest";
import { hashSeed, pathGeometry, synthSeries } from "@/lib/chart";

describe("synthSeries", () => {
  it("is deterministic for a given seed", () => {
    const a = synthSeries("weth-24h", 20, 0.02, 3400);
    const b = synthSeries("weth-24h", 20, 0.02, 3400);
    expect(a).toEqual(b);
    expect(a).toHaveLength(20);
  });

  it("differs across seeds", () => {
    const a = synthSeries("weth", 20, 0.02, 3400);
    const b = synthSeries("wbtc", 20, 0.02, 3400);
    expect(a).not.toEqual(b);
  });

  it("stays in the neighbourhood of the base value", () => {
    const vals = synthSeries("link", 60, 0.02, 14);
    for (const v of vals) {
      expect(v).toBeGreaterThan(7);
      expect(v).toBeLessThan(28);
    }
  });
});

describe("hashSeed", () => {
  it("returns a stable unsigned 32-bit int", () => {
    expect(hashSeed("weth")).toBe(hashSeed("weth"));
    expect(hashSeed("weth")).toBeGreaterThanOrEqual(0);
  });
});

describe("pathGeometry", () => {
  it("builds a closed area path and a line path", () => {
    const { line, area, lastX } = pathGeometry([1, 2, 3], 100, 50);
    expect(line.startsWith("M")).toBe(true);
    expect(area.endsWith("Z")).toBe(true);
    expect(lastX).toBe(100);
  });

  it("handles the empty case", () => {
    const geo = pathGeometry([], 100, 50);
    expect(geo.line).toBe("");
    expect(geo.lastY).toBe(50);
  });
});
