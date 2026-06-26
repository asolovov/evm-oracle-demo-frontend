import { createPublicClient, custom, toEventSelector } from "viem";
import { getInjectedProvider, viemChain } from "@/lib/wallet/injected";

/**
 * topic0 for `PriceRequested(uint256 indexed reqId, address indexed requester)`
 * (see ILighthouseAggregator.sol). reqId is the first indexed arg → topics[1].
 */
const PRICE_REQUESTED_TOPIC = toEventSelector("PriceRequested(uint256,address)");

/**
 * Waits for a `requestPrice` transaction to be mined and extracts the on-chain
 * `reqId` (a uint256) from the PriceRequested log emitted by the aggregator,
 * returned as a base-10 decimal string. Returns null if the log is absent.
 */
export async function waitForRequestId(txHash: string, aggregator: string): Promise<string | null> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No wallet available to read the receipt.");
  const client = createPublicClient({ chain: viemChain, transport: custom(provider) });

  const receipt = await client.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
  const wanted = aggregator.toLowerCase();
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== wanted) continue;
    if (log.topics[0] !== PRICE_REQUESTED_TOPIC) continue;
    const reqIdTopic = log.topics[1];
    if (!reqIdTopic) continue;
    return BigInt(reqIdTopic).toString(10);
  }
  return null;
}
