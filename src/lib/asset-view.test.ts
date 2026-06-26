import { describe, expect, it } from "vitest";
import { toTileData } from "@/lib/asset-view";
import { makeAssetSummary } from "@/test/fixtures";

const NOW = Date.parse("2026-06-26T12:00:10.000Z");

describe("toTileData", () => {
  it("derives presentational fields from a summary", () => {
    const data = toTileData(makeAssetSummary(), NOW);
    expect(data.id).toBe("weth");
    expect(data.symbol).toBe("WETH");
    expect(data.priceStr).toBe("$3,412.88");
    expect(data.sourceCount).toBe(3);
    expect(data.sourceAges).toEqual([2, 5, 11]);
    expect(data.onChainAgeStr).toBe("10s ago");
    expect(data.sparkBase).toBeCloseTo(3412.88);
  });

  it("degrades gracefully when no price is present", () => {
    const data = toTileData(
      makeAssetSummary({ latest_price: undefined, last_on_chain_at: undefined }),
      NOW,
    );
    expect(data.priceStr).toBe("—");
    expect(data.sourceCount).toBe(0);
    expect(data.sourceAges).toEqual([]);
    expect(data.onChainAgeStr).toBe("never");
    expect(data.offChainAgeStr).toBe("—");
    expect(data.sparkBase).toBe(1);
  });
});
