import "server-only";
import { createPublicClient, http } from "viem";
import { MULTICALL3 } from "@/config/contracts";
import { env } from "@/env";
import { viemChain } from "@/lib/wallet/injected";

/**
 * Read chain = the configured target chain, but with Multicall3 wired in so viem
 * can batch `eth_call`s into a single request. `viemChain` (from the wallet code)
 * has no `multicall3` and empty `rpcUrls` — it's built for the injected-wallet
 * transport — so we extend it here and supply an explicit HTTP transport.
 */
const readChain = {
  ...viemChain,
  contracts: { ...viemChain.contracts, multicall3: { address: MULTICALL3 } },
};

/**
 * Server-only public client for read-only on-chain calls. Multicall + JSON-RPC
 * batching keep request counts low (see the load budget in task 09.1). Never
 * used from the browser — reads run in Server Components / server helpers.
 */
export const chainReadClient = createPublicClient({
  chain: readChain,
  transport: http(env.RPC_URL, { batch: true, timeout: 8_000 }),
  batch: { multicall: true },
});
