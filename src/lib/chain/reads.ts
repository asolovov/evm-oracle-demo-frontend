import "server-only";
import { type Address, isHex } from "viem";
import { ASSETS, getAggregator, MULTICALL3, REPORTER_SET } from "@/config/contracts";
import { chainReadClient } from "@/lib/chain/server-client";
import { cached } from "@/lib/chain/ttl-cache";
import { multicall3Abi } from "@/lib/contracts/multicall3";
import { priceAggregatorReadsAbi } from "@/lib/contracts/price-aggregator-reads";
import { reporterSetAbi } from "@/lib/contracts/reporter-set";

const abi = priceAggregatorReadsAbi;

// TTLs: live data refreshes ~per block; the reporter set is effectively static.
const LIVE_TTL = 12_000;
const STATIC_TTL = 3_600_000;

/** Representative gas for a fulfillPrice tx, used when no real receipt is on hand. */
const DEFAULT_FULFILL_GAS = 130_000n;

export type OnChainFeed = {
  roundId: bigint;
  answer: bigint;
  updatedAt: bigint;
  decimals: number;
  requestFee: bigint;
  maxAge: bigint;
  nextReqId: bigint;
  description: string;
};

export type OnChainRound = { roundId: bigint; answer: bigint; updatedAt: bigint };
export type ReporterSetInfo = { reporters: Address[]; threshold: number };
export type LatestRound = { roundId: bigint; answer: bigint; updatedAt: bigint; nextReqId: bigint };

// --- raw fetchers (throw on RPC error; one multicall each) -------------------

async function fetchOnChainFeed(assetId: string): Promise<OnChainFeed | null> {
  const aggregator = getAggregator(assetId);
  if (!aggregator) return null;
  const [round, decimals, requestFee, maxAge, nextReqId, description] =
    await chainReadClient.multicall({
      allowFailure: false,
      contracts: [
        { address: aggregator, abi, functionName: "latestRoundData" },
        { address: aggregator, abi, functionName: "decimals" },
        { address: aggregator, abi, functionName: "requestFee" },
        { address: aggregator, abi, functionName: "maxAge" },
        { address: aggregator, abi, functionName: "nextReqId" },
        { address: aggregator, abi, functionName: "description" },
      ],
    });
  return {
    roundId: round[0],
    answer: round[1],
    updatedAt: round[3],
    decimals: Number(decimals),
    requestFee,
    maxAge,
    nextReqId,
    description,
  };
}

async function fetchRecentRounds(
  assetId: string,
  latestRoundId: bigint,
  count: number,
): Promise<OnChainRound[]> {
  const aggregator = getAggregator(assetId);
  if (!aggregator || latestRoundId <= 0n) return [];
  const ids: bigint[] = [];
  for (let r = latestRoundId; r > 0n && ids.length < count; r--) ids.push(r);
  const results = await chainReadClient.multicall({
    allowFailure: true,
    contracts: ids.map((id) => ({
      address: aggregator,
      abi,
      functionName: "getRoundData" as const,
      args: [id] as const,
    })),
  });
  const out: OnChainRound[] = [];
  for (const res of results) {
    if (res.status === "success") {
      out.push({ roundId: res.result[0], answer: res.result[1], updatedAt: res.result[3] });
    }
  }
  return out;
}

async function fetchReporterSet(): Promise<ReporterSetInfo> {
  const [reporters, threshold] = await chainReadClient.multicall({
    allowFailure: false,
    contracts: [
      { address: REPORTER_SET, abi: reporterSetAbi, functionName: "getReporters" },
      { address: REPORTER_SET, abi: reporterSetAbi, functionName: "getThreshold" },
    ],
  });
  return { reporters: [...reporters], threshold: Number(threshold) };
}

async function fetchAllLatestRounds(): Promise<Record<string, LatestRound>> {
  const results = await chainReadClient.multicall({
    allowFailure: true,
    contracts: ASSETS.flatMap((a) => [
      { address: a.aggregator, abi, functionName: "latestRoundData" as const },
      { address: a.aggregator, abi, functionName: "nextReqId" as const },
    ]),
  });
  const out: Record<string, LatestRound> = {};
  ASSETS.forEach((a, i) => {
    const round = results[i * 2];
    const next = results[i * 2 + 1];
    // Mixed-function multicall → results are a union; narrow by shape.
    if (round?.status === "success" && typeof round.result !== "bigint") {
      const t = round.result;
      out[a.id] = {
        roundId: t[0],
        answer: t[1],
        updatedAt: t[3],
        nextReqId: next?.status === "success" && typeof next.result === "bigint" ? next.result : 0n,
      };
    }
  });
  return out;
}

// --- public helpers (cached + fail-soft) -------------------------------------

/** One aggregator's on-chain facts (1 multicall). Null on unknown asset / RPC error. */
export function getOnChainFeed(assetId: string): Promise<OnChainFeed | null> {
  return cached(`feed:${assetId}`, LIVE_TTL, () => fetchOnChainFeed(assetId)).catch(() => null);
}

/** Recent on-chain rounds, newest first (1 multicall). Pass the latest round id
 * from {@link getOnChainFeed} so this stays within the drill-down's 2-request budget. */
export function getRecentRounds(
  assetId: string,
  latestRoundId: bigint,
  count = 8,
): Promise<OnChainRound[]> {
  return cached(`rounds:${assetId}:${latestRoundId}:${count}`, LIVE_TTL, () =>
    fetchRecentRounds(assetId, latestRoundId, count),
  ).catch(() => []);
}

/** The live M-of-N reporter set (1 multicall, long-cached). Null on RPC error. */
export function getReporterSet(): Promise<ReporterSetInfo | null> {
  return cached("reporterSet", STATIC_TTL, fetchReporterSet).catch(() => null);
}

/** Latest answer + nextReqId for all 10 assets in ONE multicall (dashboard). */
export function getAllLatestRounds(): Promise<Record<string, LatestRound>> {
  return cached("allLatestRounds", LIVE_TTL, fetchAllLatestRounds).catch(() => ({}));
}

/** Latest block number (1 request). Null on RPC error. */
export function getLatestBlock(): Promise<bigint | null> {
  return cached("block", LIVE_TTL, () => chainReadClient.getBlockNumber()).catch(() => null);
}

export type ReporterFunding = {
  /** Reporter address → native balance (wei). */
  balances: Record<string, bigint>;
  /** Average fulfillPrice cost (wei) = representative gas × live gas price. */
  avgTxCostWei: bigint;
};

async function fetchReporterFunding(
  reporters: readonly Address[],
  sampleTxHash?: string,
): Promise<ReporterFunding> {
  // All balances in one Multicall3 batch.
  const balResults = await chainReadClient.multicall({
    allowFailure: true,
    contracts: reporters.map((r) => ({
      address: MULTICALL3,
      abi: multicall3Abi,
      functionName: "getEthBalance" as const,
      args: [r] as const,
    })),
  });
  const balances: Record<string, bigint> = {};
  reporters.forEach((r, i) => {
    const res = balResults[i];
    balances[r] = res?.status === "success" ? res.result : 0n;
  });

  // Average tx cost = representative fulfillPrice gas × live gas price. Use a
  // real recent fulfilment receipt's gasUsed when one is available.
  const gasPrice = await chainReadClient.getGasPrice();
  let gasUsed = DEFAULT_FULFILL_GAS;
  if (sampleTxHash && isHex(sampleTxHash)) {
    try {
      const receipt = await chainReadClient.getTransactionReceipt({ hash: sampleTxHash });
      if (receipt.gasUsed > 0n) gasUsed = receipt.gasUsed;
    } catch {
      // No receipt (RPC/pruned) — keep the representative default.
    }
  }

  return { balances, avgTxCostWei: gasUsed * gasPrice };
}

/** Reporter balances + average tx cost (for funding runway). Null on RPC error. */
export function getReporterFunding(
  reporters: readonly Address[],
  sampleTxHash?: string,
): Promise<ReporterFunding | null> {
  const key = `funding:${reporters.join(",")}:${sampleTxHash ?? ""}`;
  return cached(key, LIVE_TTL, () => fetchReporterFunding(reporters, sampleTxHash)).catch(
    () => null,
  );
}
