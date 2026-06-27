import { env } from "@/env";

/**
 * Single source of truth for the target chain. Values come from NEXT_PUBLIC_*
 * env vars (see src/env.ts) so the demo can be re-pointed without code changes.
 * Defaults target Ethereum Sepolia (chainId 11155111).
 */
export const CHAIN = {
  id: env.NEXT_PUBLIC_CHAIN_ID,
  name: env.NEXT_PUBLIC_CHAIN_NAME,
  /** 0x-prefixed hex chain id, used by EIP-1193 `wallet_switchEthereumChain`. */
  hexId: `0x${env.NEXT_PUBLIC_CHAIN_ID.toString(16)}`,
  explorerUrl: env.NEXT_PUBLIC_EXPLORER_URL,
} as const;

/** Explorer link to a transaction hash. */
export function explorerTx(hash: string): string {
  return `${CHAIN.explorerUrl}/tx/${hash}`;
}

/** Explorer link to an address. */
export function explorerAddress(address: string): string {
  return `${CHAIN.explorerUrl}/address/${address}`;
}
