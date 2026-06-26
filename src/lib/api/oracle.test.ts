import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { buildRequestTx, getAssetPrice, getAssets, getSubmissions } from "@/lib/api/oracle";
import { server } from "@/test/msw/server";

describe("oracle API access", () => {
  it("getAssets parses the catalog", async () => {
    const { assets } = await getAssets();
    expect(assets).toHaveLength(10);
    expect(assets[0]?.symbol).toBe("WETH");
    expect(assets[0]?.latest_price?.sources).toHaveLength(3);
  });

  it("getAssetPrice returns detail for a known asset", async () => {
    const detail = await getAssetPrice("weth");
    expect(detail.asset.symbol).toBe("WETH");
    expect(detail.last_round_id).toBe("18437");
    expect(detail.sources.length).toBeGreaterThan(0);
  });

  it("getAssetPrice throws a typed 404 for an unknown asset", async () => {
    await expect(getAssetPrice("nope")).rejects.toBeInstanceOf(ApiError);
    await expect(getAssetPrice("nope")).rejects.toMatchObject({ status: 404 });
  });

  it("buildRequestTx returns the calldata tuple", async () => {
    const tx = await buildRequestTx("weth", 11155111);
    expect(tx.to).toMatch(/^0x/);
    expect(tx.data).toBe("0xdeadbeef");
    expect(tx.chain_id).toBe(11155111);
  });

  it("getSubmissions parses a page", async () => {
    const { submissions, page } = await getSubmissions({ assetId: "weth" });
    expect(submissions.length).toBe(2);
    expect(page.total_items).toBe(2);
  });

  it("surfaces upstream 502s as ApiError", async () => {
    server.use(
      http.get("*/api/v1/assets", () =>
        HttpResponse.json({ code: "upstream", message: "price-service down" }, { status: 502 }),
      ),
    );
    await expect(getAssets()).rejects.toMatchObject({ status: 502 });
  });
});
