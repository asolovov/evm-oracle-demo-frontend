import { createPublicClient, custom, encodeFunctionData } from "viem";
import { getAggregator } from "@/config/contracts";
import { priceAggregatorAbi } from "@/lib/contracts/price-aggregator";
import { getInjectedProvider, viemChain } from "@/lib/wallet/injected";

export type RequestTx = { to: string; data: string; value: string };

/**
 * Builds the `requestPrice()` transaction for an asset entirely client-side:
 * resolves the aggregator from the deployment config, reads its current
 * `requestFee` on-chain (the required msg.value), and ABI-encodes the call. No
 * BFF round-trip — the dashboard owns the ABI and addresses.
 */
export async function buildRequestTx(assetId: string): Promise<RequestTx> {
  const aggregator = getAggregator(assetId);
  if (!aggregator) {
    throw new Error(`No aggregator is configured for "${assetId}".`);
  }
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No wallet available.");

  const client = createPublicClient({ chain: viemChain, transport: custom(provider) });
  const fee = await client.readContract({
    address: aggregator,
    abi: priceAggregatorAbi,
    functionName: "requestFee",
  });
  const data = encodeFunctionData({ abi: priceAggregatorAbi, functionName: "requestPrice" });

  return { to: aggregator, data, value: fee.toString() };
}
