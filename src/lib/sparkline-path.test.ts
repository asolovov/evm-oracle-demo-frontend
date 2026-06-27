import { describe, expect, it } from "vitest";
import { linePath } from "@/lib/sparkline-path";

describe("linePath", () => {
  it("builds a line path and a closed area path", () => {
    const { line, area } = linePath([1, 2, 3], 100, 40);
    expect(line.startsWith("M")).toBe(true);
    expect(area.endsWith("Z")).toBe(true);
  });
  it("handles the empty case", () => {
    expect(linePath([], 100, 40)).toEqual({ line: "", area: "" });
  });
  it("centers a single point", () => {
    const { line } = linePath([5], 100, 40);
    expect(line).toContain("50.0");
  });
});
