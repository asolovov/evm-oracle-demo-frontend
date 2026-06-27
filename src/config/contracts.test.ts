import { describe, expect, it } from "vitest";
import { getAggregator, resolveAsset } from "@/config/contracts";

describe("resolveAsset", () => {
  it("resolves a canonical asset id", () => {
    expect(resolveAsset("xau")?.symbol).toBe("XAU");
    expect(resolveAsset("WETH")?.id).toBe("weth");
  });

  it("resolves an on-chain bytes32 assetId (any case)", () => {
    const xau = "0x7c687a3207cd9c05b4b11d8dd7ac337919c2200102d72989a597ebc5afcf180b";
    expect(resolveAsset(xau)?.id).toBe("xau");
    expect(resolveAsset(xau.toUpperCase())?.symbol).toBe("XAU");
  });

  it("returns undefined for an unknown id", () => {
    expect(resolveAsset("0xdeadbeef")).toBeUndefined();
    expect(resolveAsset("nope")).toBeUndefined();
  });
});

describe("getAggregator", () => {
  it("returns the aggregator address for a known asset", () => {
    expect(getAggregator("spx")).toBe("0x3fa9e3fd3e5e70f26ccf4b67825489276f9cbb27");
  });
  it("returns undefined for an unknown asset", () => {
    expect(getAggregator("nope")).toBeUndefined();
  });
});
