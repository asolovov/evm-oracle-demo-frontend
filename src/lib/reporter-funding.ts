import { formatEther } from "viem";
import { shorten } from "@/lib/format";

export type FundingTone = "ok" | "warn" | "red";

export type ReporterFund = {
  address: string;
  addressShort: string;
  balanceEth: string;
  /** Whole transactions of runway = balance ÷ average fulfillPrice cost. */
  remainingTxs: number;
  tone: FundingTone;
};

/** Whole-tx runway from a balance and the average per-tx cost. */
export function remainingTxs(balanceWei: bigint, avgTxCostWei: bigint): number {
  if (avgTxCostWei <= 0n) return Number.POSITIVE_INFINITY;
  return Number(balanceWei / avgTxCostWei);
}

/** Funding tone from runway against the configured thresholds. */
export function fundingTone(txs: number, warnTxs: number, redTxs: number): FundingTone {
  if (txs < redTxs) return "red";
  if (txs < warnTxs) return "warn";
  return "ok";
}

/** Format a wei balance to a short ETH string (4 dp). */
function ethStr(wei: bigint): string {
  const n = Number(formatEther(wei));
  return Number.isFinite(n) ? n.toFixed(4) : "0.0000";
}

/** Build display models for the reporter-funding lines in node.log. */
export function buildReporterFunds(
  items: readonly { address: string; balanceWei: bigint }[],
  avgTxCostWei: bigint,
  warnTxs: number,
  redTxs: number,
): ReporterFund[] {
  return items.map((it) => {
    const txs = remainingTxs(it.balanceWei, avgTxCostWei);
    return {
      address: it.address,
      addressShort: shorten(it.address),
      balanceEth: ethStr(it.balanceWei),
      remainingTxs: Number.isFinite(txs) ? txs : 0,
      tone: fundingTone(txs, warnTxs, redTxs),
    };
  });
}
