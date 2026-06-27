import { beforeEach, describe, expect, it, vi } from "vitest";
import { ASSETS } from "@/config/contracts";

// Mock the server client so no real RPC happens; we control results + count calls.
const mockClient = vi.hoisted(() => ({
  multicall: vi.fn<(args: unknown) => Promise<unknown>>(),
  getBlockNumber: vi.fn<() => Promise<bigint>>(),
  getGasPrice: vi.fn<() => Promise<bigint>>(),
  getTransactionReceipt: vi.fn<(args: unknown) => Promise<{ gasUsed: bigint }>>(),
}));
vi.mock("@/lib/chain/server-client", () => ({ chainReadClient: mockClient }));

import {
  getAllLatestRounds,
  getLatestBlock,
  getOnChainFeed,
  getRecentRounds,
  getReporterFunding,
  getReporterSet,
} from "@/lib/chain/reads";
import { clearCache } from "@/lib/chain/ttl-cache";

// latestRoundData tuple: [roundId, answer, startedAt, updatedAt, answeredInRound]
const ROUND = [4n, 409060009800n, 0n, 1782576648n, 4n] as const;
const MAX_UINT = 2n ** 256n - 1n;

beforeEach(() => {
  clearCache();
  vi.clearAllMocks();
});

describe("getOnChainFeed", () => {
  it("maps the multicall tuple into a typed feed", async () => {
    mockClient.multicall.mockResolvedValueOnce([ROUND, 8, 0n, MAX_UINT, 8n, "Gold (USD/oz)"]);
    const feed = await getOnChainFeed("xau");
    expect(feed).toEqual({
      roundId: 4n,
      answer: 409060009800n,
      updatedAt: 1782576648n,
      decimals: 8,
      requestFee: 0n,
      maxAge: MAX_UINT,
      nextReqId: 8n,
      description: "Gold (USD/oz)",
    });
    expect(mockClient.multicall).toHaveBeenCalledTimes(1);
  });

  it("returns null for an unknown asset WITHOUT hitting RPC", async () => {
    const feed = await getOnChainFeed("nope");
    expect(feed).toBeNull();
    expect(mockClient.multicall).not.toHaveBeenCalled();
  });

  it("degrades to null when the RPC call throws", async () => {
    mockClient.multicall.mockRejectedValueOnce(new Error("rpc down"));
    expect(await getOnChainFeed("xau")).toBeNull();
  });
});

describe("getAllLatestRounds", () => {
  it("reads all 10 assets in ONE multicall (load budget)", async () => {
    const results = ASSETS.flatMap(() => [
      { status: "success", result: ROUND },
      { status: "success", result: 8n },
    ]);
    mockClient.multicall.mockResolvedValueOnce(results);
    const map = await getAllLatestRounds();
    expect(Object.keys(map)).toHaveLength(ASSETS.length);
    expect(map.xau).toEqual({
      roundId: 4n,
      answer: 409060009800n,
      updatedAt: 1782576648n,
      nextReqId: 8n,
    });
    expect(mockClient.multicall).toHaveBeenCalledTimes(1);
  });

  it("skips assets whose round read failed", async () => {
    type McEntry = { status: "success"; result: unknown } | { status: "failure"; error: Error };
    const results: McEntry[] = [];
    ASSETS.forEach((_, i) => {
      if (i === 0) {
        results.push(
          { status: "failure", error: new Error("x") },
          { status: "failure", error: new Error("x") },
        );
      } else {
        results.push({ status: "success", result: ROUND }, { status: "success", result: 8n });
      }
    });
    mockClient.multicall.mockResolvedValueOnce(results);
    const map = await getAllLatestRounds();
    expect(Object.keys(map)).toHaveLength(ASSETS.length - 1);
  });

  it("caches across calls within the TTL (no second multicall)", async () => {
    const results = ASSETS.flatMap(() => [
      { status: "success", result: ROUND },
      { status: "success", result: 8n },
    ]);
    mockClient.multicall.mockResolvedValueOnce(results);
    await getAllLatestRounds();
    await getAllLatestRounds();
    expect(mockClient.multicall).toHaveBeenCalledTimes(1);
  });
});

describe("getRecentRounds", () => {
  it("returns successful rounds, newest first, filtering failures", async () => {
    mockClient.multicall.mockResolvedValueOnce([
      { status: "success", result: [4n, 409060009800n, 0n, 1782576648n, 4n] },
      { status: "success", result: [3n, 407630004900n, 0n, 1782497700n, 3n] },
      { status: "failure", error: new Error("missing") },
    ]);
    const rounds = await getRecentRounds("xau", 4n, 3);
    expect(rounds).toEqual([
      { roundId: 4n, answer: 409060009800n, updatedAt: 1782576648n },
      { roundId: 3n, answer: 407630004900n, updatedAt: 1782497700n },
    ]);
  });

  it("returns [] without RPC when there are no rounds yet", async () => {
    const rounds = await getRecentRounds("xau", 0n, 8);
    expect(rounds).toEqual([]);
    expect(mockClient.multicall).not.toHaveBeenCalled();
  });
});

describe("getReporterSet", () => {
  it("maps reporters + threshold", async () => {
    mockClient.multicall.mockResolvedValueOnce([
      ["0x7ab705fAa77CC9c6469916b9138Cc22B7d816F0d", "0xB0fEEcE62f7eAfA38C59656E1047362a83F22e61"],
      2n,
    ]);
    const set = await getReporterSet();
    expect(set?.threshold).toBe(2);
    expect(set?.reporters).toHaveLength(2);
  });

  it("degrades to null on RPC error", async () => {
    mockClient.multicall.mockRejectedValueOnce(new Error("down"));
    expect(await getReporterSet()).toBeNull();
  });
});

describe("getLatestBlock", () => {
  it("returns the block number", async () => {
    mockClient.getBlockNumber.mockResolvedValueOnce(6_284_193n);
    expect(await getLatestBlock()).toBe(6_284_193n);
  });
  it("degrades to null on error", async () => {
    mockClient.getBlockNumber.mockRejectedValueOnce(new Error("down"));
    expect(await getLatestBlock()).toBeNull();
  });
});

describe("getReporterFunding", () => {
  const A = "0xaaaa000000000000000000000000000000000001" as const;
  const B = "0xbbbb000000000000000000000000000000000002" as const;

  it("reads balances (1 multicall) + avg cost from a real receipt's gasUsed", async () => {
    mockClient.multicall.mockResolvedValueOnce([
      { status: "success", result: 5n * 10n ** 16n },
      { status: "success", result: 10n * 10n ** 16n },
    ]);
    mockClient.getGasPrice.mockResolvedValueOnce(2n * 10n ** 9n);
    mockClient.getTransactionReceipt.mockResolvedValueOnce({ gasUsed: 100_000n });
    const f = await getReporterFunding([A, B], `0x${"a".repeat(64)}`);
    expect(f?.balances[A]).toBe(5n * 10n ** 16n);
    expect(f?.avgTxCostWei).toBe(100_000n * 2n * 10n ** 9n);
    expect(mockClient.multicall).toHaveBeenCalledTimes(1);
    expect(mockClient.getTransactionReceipt).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default gas when there is no sample tx", async () => {
    mockClient.multicall.mockResolvedValueOnce([{ status: "success", result: 1n }]);
    mockClient.getGasPrice.mockResolvedValueOnce(1n);
    const f = await getReporterFunding([A]);
    expect(f?.avgTxCostWei).toBe(130_000n);
    expect(mockClient.getTransactionReceipt).not.toHaveBeenCalled();
  });

  it("degrades to null on RPC error", async () => {
    mockClient.multicall.mockRejectedValueOnce(new Error("down"));
    expect(await getReporterFunding([A])).toBeNull();
  });
});
