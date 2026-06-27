import type { Address, Hex } from "viem";

/**
 * Deployed contract metadata for the target chain (Ethereum Sepolia), taken from
 * the contracts repo's `deployments/ethereum-sepolia/addresses.json`. The
 * frontend builds `requestPrice()` calldata directly against the per-asset
 * aggregator, so it does not depend on the BFF/indexer resolving addresses.
 *
 * `id` is the canonical lowercase id used by the REST catalog; `assetId` is the
 * on-chain bytes32 (keccak256("SYMBOL/USD")). The two are needed because the BFF
 * is inconsistent — `/submissions` returns the canonical id, but
 * `/requests/{reqId}` returns the bytes32 assetId.
 */
export const ORACLE_REGISTRY: Address = "0x89a6c12a403733c6a817472cec46a530581cb7ef";

export type AssetMeta = { id: string; symbol: string; aggregator: Address; assetId: Hex };

export const ASSETS: AssetMeta[] = [
  {
    id: "weth",
    symbol: "WETH",
    aggregator: "0x075be31662c2548c4e940d7e769c328a34dcb281",
    assetId: "0x0f8a193ff464434486c0daf7db2a895884365d2bc84ba47a68fcf89c1b14b5b8",
  },
  {
    id: "wbtc",
    symbol: "WBTC",
    aggregator: "0xf8ad3a2505eece7ad276db038c7c56930bd436e4",
    assetId: "0x98da2c5e4c6b1db946694570273b859a6e4083ccc8faa155edfc4c54eb3cfd73",
  },
  {
    id: "link",
    symbol: "LINK",
    aggregator: "0xecc43e6ec38ce135b81ae8042df96eef55915d14",
    assetId: "0x921a3539bcb764c889432630877414523e7fbca00c211bc787aeae69e2e3a779",
  },
  {
    id: "uni",
    symbol: "UNI",
    aggregator: "0x69d16087172f404925ffc61c0ac25c608ff215b4",
    assetId: "0xfba01d52a7cd84480d0573725899486a0b5e55c20ff45d6628874349375d1650",
  },
  {
    id: "aave",
    symbol: "AAVE",
    aggregator: "0xa011fa0757b5d2a9a4c73cfb4647c29d96da7a2f",
    assetId: "0xde46fbfa339d54cd65b79d8320a7a53c78177565c2aaf4c8b13eed7865e7cfc8",
  },
  {
    id: "xau",
    symbol: "XAU",
    aggregator: "0x61125ef037305e4b81c5e5a864225860f455d318",
    assetId: "0x7c687a3207cd9c05b4b11d8dd7ac337919c2200102d72989a597ebc5afcf180b",
  },
  {
    id: "xag",
    symbol: "XAG",
    aggregator: "0x4e05cc443cbcd5425b5b7c7df124101ad70b8b02",
    assetId: "0x5ccc5c04130d272bf07d6e066f4cae40cfc0313643d815db3e17af00e6ebf601",
  },
  {
    id: "spx",
    symbol: "SPX",
    aggregator: "0x3fa9e3fd3e5e70f26ccf4b67825489276f9cbb27",
    assetId: "0x1308465f1da3a6702b88abc29db16011bdb6f6a7cb404fee1daa81f8da9d9972",
  },
  {
    id: "wti",
    symbol: "WTI",
    aggregator: "0x70131a2612682f7d56a2a30010075e8f0e9d8eca",
    assetId: "0x1f29567db4e0c1628fa0f8675c031b615246dd0dd3de399fdf8b5aec1829181d",
  },
  {
    id: "hg",
    symbol: "HG",
    aggregator: "0x87249f3aeb58c46be3f5edd1d5071ee76d816900",
    assetId: "0x7f1edccb34ff65dc749f950e76926ca09253b4f2e87cc2a946d4ecaa2716decf",
  },
];

const BY_ID = new Map(ASSETS.map((a) => [a.id, a]));
const BY_ASSET_ID = new Map(ASSETS.map((a) => [a.assetId.toLowerCase(), a]));

/** The aggregator address for a canonical asset id, or undefined if unknown. */
export function getAggregator(assetId: string): Address | undefined {
  return BY_ID.get(assetId.toLowerCase())?.aggregator;
}

/**
 * Resolve a BFF `asset_id` — which is the canonical id (`"xau"`) on some
 * endpoints and the on-chain bytes32 (`"0x7c68…"`) on others — to asset metadata.
 */
export function resolveAsset(idOrAssetId: string): AssetMeta | undefined {
  const key = idOrAssetId.toLowerCase();
  return BY_ID.get(key) ?? BY_ASSET_ID.get(key);
}
