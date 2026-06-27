import { createPublicClient, custom, isAddress, isHex } from "viem";
import { getInjectedProvider, viemChain } from "@/lib/wallet/injected";

/**
 * Pre-flight gas estimation for a prebuilt transaction. A transaction that would
 * revert on-chain fails estimation, so this lets the request flow catch a doomed
 * tx and show a clear message instead of broadcasting it and surfacing the
 * wallet/RPC's cryptic "gas limit too high" / "internal error". Throws on any
 * estimation failure (revert or RPC error) — the caller treats that as
 * "do not send".
 */
export async function estimateRequestGas(tx: {
  to: string;
  data: string;
  value: string;
  account: string;
}): Promise<bigint> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No wallet available.");
  if (!isAddress(tx.account)) throw new Error("Connect a wallet first.");
  if (!isAddress(tx.to)) throw new Error("Invalid transaction target address.");
  if (!isHex(tx.data)) throw new Error("Invalid transaction calldata.");
  const client = createPublicClient({ chain: viemChain, transport: custom(provider) });
  return client.estimateGas({
    account: tx.account,
    to: tx.to,
    data: tx.data,
    value: BigInt(tx.value || "0"),
  });
}
