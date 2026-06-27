import { createPublicClient, custom, isHex, padHex, toEventSelector } from "viem";
import { getInjectedProvider, viemChain } from "@/lib/wallet/injected";

/**
 * topic0 for `PriceRequested(uint256 indexed reqId, address indexed requester)`
 * (see ILighthouseAggregator.sol). reqId is the first indexed arg → topics[1];
 * requester is the second → topics[2] (a 32-byte left-padded address).
 */
const PRICE_REQUESTED_TOPIC = toEventSelector("PriceRequested(uint256,address)");

/**
 * Waits for a `requestPrice` transaction to be mined and extracts the on-chain
 * `reqId` (a uint256) from the PriceRequested log, returned as a base-10 decimal
 * string. Returns null if no matching log is present.
 *
 * The user's own tx emits exactly one PriceRequested, so we match on topic0
 * first. When several candidates exist we prefer the log from the expected
 * aggregator, then one whose requester topic matches the connected account, then
 * fall back to the first — this survives the aggregator sitting behind a proxy.
 */
export async function waitForRequestId(
  txHash: string,
  { aggregator, requester }: { aggregator: string; requester: string },
): Promise<string | null> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No wallet available to read the receipt.");
  if (!isHex(txHash)) throw new Error("Invalid transaction hash.");
  const client = createPublicClient({ chain: viemChain, transport: custom(provider) });

  const receipt = await client.waitForTransactionReceipt({ hash: txHash });

  const candidates = receipt.logs.filter(
    (log) => log.topics[0] === PRICE_REQUESTED_TOPIC && log.topics[1],
  );
  if (candidates.length === 0) return null;

  const wantedAggregator = aggregator.toLowerCase();
  const requesterTopic = isHex(requester) ? padHex(requester, { size: 32 }).toLowerCase() : null;

  const best =
    candidates.find((log) => log.address.toLowerCase() === wantedAggregator) ??
    candidates.find((log) => log.topics[2]?.toLowerCase() === requesterTopic) ??
    candidates[0];

  const reqIdTopic = best?.topics[1];
  return reqIdTopic ? BigInt(reqIdTopic).toString(10) : null;
}
