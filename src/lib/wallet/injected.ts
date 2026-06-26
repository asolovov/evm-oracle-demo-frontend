import { defineChain, type EIP1193Provider } from "viem";
import { CHAIN } from "@/config/chain";

/** The configured target chain, as a viem chain object. */
export const viemChain = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  // Transport is the injected wallet's RPC; no public URL needed here.
  rpcUrls: { default: { http: [] } },
  blockExplorers: { default: { name: "Explorer", url: CHAIN.explorerUrl } },
});

export type InjectedProvider = EIP1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

/** The browser's EIP-1193 wallet provider, or null when none is installed. */
export function getInjectedProvider(): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: InjectedProvider }).ethereum;
  return eth ?? null;
}
