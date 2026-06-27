import type { Address } from "viem";

/**
 * Deployed contract addresses for the target chain (Ethereum Sepolia), taken
 * from the contracts repo's `deployments/ethereum-sepolia/addresses.json`. The
 * frontend builds `requestPrice()` calldata directly against the per-asset
 * aggregator, so it does not depend on the BFF/indexer resolving addresses.
 *
 * Keyed by the canonical lowercase asset id used by the REST API.
 */
export const ORACLE_REGISTRY: Address = "0x89a6c12a403733c6a817472cec46a530581cb7ef";

export const AGGREGATORS: Record<string, Address> = {
  weth: "0x075be31662c2548c4e940d7e769c328a34dcb281",
  wbtc: "0xf8ad3a2505eece7ad276db038c7c56930bd436e4",
  link: "0xecc43e6ec38ce135b81ae8042df96eef55915d14",
  uni: "0x69d16087172f404925ffc61c0ac25c608ff215b4",
  aave: "0xa011fa0757b5d2a9a4c73cfb4647c29d96da7a2f",
  xau: "0x61125ef037305e4b81c5e5a864225860f455d318",
  xag: "0x4e05cc443cbcd5425b5b7c7df124101ad70b8b02",
  spx: "0x3fa9e3fd3e5e70f26ccf4b67825489276f9cbb27",
  wti: "0x70131a2612682f7d56a2a30010075e8f0e9d8eca",
  hg: "0x87249f3aeb58c46be3f5edd1d5071ee76d816900",
};

/** The aggregator address for an asset id, or undefined if not deployed/known. */
export function getAggregator(assetId: string): Address | undefined {
  return AGGREGATORS[assetId.toLowerCase()];
}
