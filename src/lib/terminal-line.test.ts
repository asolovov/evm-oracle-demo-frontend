import { describe, expect, it } from "vitest";
import type { AggregatedPrice, IndexerEvent, SubmissionStatus } from "@/lib/api/schemas";
import { eventToLine, hms, priceToLine, submissionToLine } from "@/lib/terminal-line";

const NOW = new Date("2026-06-27T00:00:09.000Z");

describe("hms", () => {
  it("formats HH:MM:SS (UTC)", () => {
    expect(hms(new Date("2026-06-27T12:34:56.000Z"))).toBe("12:34:56");
  });
});

describe("submissionToLine", () => {
  const base: SubmissionStatus = {
    req_id: "42",
    asset_id: "weth",
    tx_hash: "0xabc",
    submitted_price: "345020000000",
    submitted_at: "2026-06-27T00:00:05.000Z",
    status: "confirmed",
    retry_count: 0,
  };

  it("links a consumer submission via reqId", () => {
    const l = submissionToLine(base);
    expect(l.tag).toBe("SUBMIT");
    expect(l.ts).toBe("00:00:05");
    expect(l.text).toBe("WETH $3,450.20 confirmed req#42");
    expect(l.reqId).toBe("42");
  });

  it("labels heartbeats and omits reqId", () => {
    const l = submissionToLine({ ...base, req_id: "0" });
    expect(l.text).toContain("heartbeat");
    expect(l.reqId).toBeUndefined();
  });
});

describe("priceToLine", () => {
  it("renders the median + source count", () => {
    const p: AggregatedPrice = {
      asset_id: "weth",
      median_price: 3412.88,
      aggregated_at: "2026-06-27T00:00:00Z",
      sources: [
        { source: "coingecko", price: 1, fetched_at: "", age_sec: 1, included: true },
        { source: "binance", price: 1, fetched_at: "", age_sec: 1, included: true },
      ],
    };
    const l = priceToLine(p, NOW);
    expect(l.tag).toBe("PRICE");
    expect(l.text).toBe("WETH $3,412.88 · median of 2 src");
  });
});

describe("eventToLine", () => {
  it("maps PRICE_FULFILLED with round + reqId", () => {
    const e: IndexerEvent = {
      kind: "PRICE_FULFILLED",
      price_fulfilled: {
        req_id: "9",
        asset_id: "weth",
        price: "345020000000",
        timestamp: "0",
        round_id: "5",
      },
      meta: { tx_hash: "0xdef" },
    };
    const l = eventToLine(e, NOW);
    expect(l?.tag).toBe("FULFILLED");
    expect(l?.text).toBe("WETH $3,450.20 round#5 req#9");
    expect(l?.reqId).toBe("9");
  });

  it("resolves a bytes32 asset id on ASSET_REGISTERED", () => {
    const e: IndexerEvent = {
      kind: "ASSET_REGISTERED",
      asset_registered: {
        asset_id: "0x7c687a3207cd9c05b4b11d8dd7ac337919c2200102d72989a597ebc5afcf180b",
        aggregator: "0x61125ef037305e4b81c5e5a864225860f455d318",
      },
    };
    const l = eventToLine(e, NOW);
    expect(l?.tag).toBe("REGISTERED");
    expect(l?.text).toContain("XAU");
  });

  it("returns null for an unrecognized kind", () => {
    expect(eventToLine({ kind: "" }, NOW)).toBeNull();
  });
});
