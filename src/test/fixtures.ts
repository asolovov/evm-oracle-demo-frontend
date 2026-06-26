import type {
  AssetSummary,
  PriceDetail,
  RequestSummary,
  SubmissionStatus,
} from "@/lib/api/schemas";

const ISO = "2026-06-26T12:00:00.000Z";

/** A representative crypto asset summary with three sources. */
export function makeAssetSummary(overrides: Partial<AssetSummary> = {}): AssetSummary {
  return {
    id: "weth",
    symbol: "WETH",
    name: "Wrapped Ether",
    class: "crypto",
    aggregator_address: "0x7a3f9C2bA8e4D1f06C5B2d934aE7c0F1b8e91C44",
    latest_price: {
      asset_id: "weth",
      median_price: 3412.88,
      aggregated_at: ISO,
      sources: [
        { source: "coingecko", price: 3412.5, fetched_at: ISO, age_sec: 2, included: true },
        { source: "binance", price: 3413.2, fetched_at: ISO, age_sec: 5, included: true },
        { source: "uniswap_v3", price: 3411.9, fetched_at: ISO, age_sec: 11, included: true },
      ],
    },
    last_on_chain_price: "341288000000",
    last_on_chain_at: ISO,
    last_on_chain_tx: "0x9f2c000000000000000000000000000000000000000000000000000000000a71b",
    ...overrides,
  };
}

/** The 10-asset universe (5 crypto + 5 RWA). */
export const ASSET_CATALOG: AssetSummary[] = [
  makeAssetSummary({ id: "weth", symbol: "WETH", name: "Wrapped Ether" }),
  makeAssetSummary({ id: "wbtc", symbol: "WBTC", name: "Wrapped Bitcoin" }),
  makeAssetSummary({ id: "link", symbol: "LINK", name: "Chainlink" }),
  makeAssetSummary({ id: "uni", symbol: "UNI", name: "Uniswap" }),
  makeAssetSummary({ id: "aave", symbol: "AAVE", name: "Aave" }),
  makeAssetSummary({ id: "xau", symbol: "XAU", name: "Gold", class: "rwa" }),
  makeAssetSummary({ id: "xag", symbol: "XAG", name: "Silver", class: "rwa" }),
  makeAssetSummary({ id: "spx", symbol: "SPX", name: "S&P 500", class: "rwa" }),
  makeAssetSummary({ id: "wti", symbol: "WTI", name: "Crude Oil", class: "rwa" }),
  makeAssetSummary({ id: "hg", symbol: "HG", name: "Copper", class: "rwa" }),
];

export function makePriceDetail(overrides: Partial<PriceDetail> = {}): PriceDetail {
  const summary = makeAssetSummary();
  const price = summary.latest_price;
  if (!price) throw new Error("fixture missing price");
  return {
    asset: {
      id: summary.id,
      symbol: summary.symbol,
      name: summary.name,
      class: summary.class,
      aggregator_address: summary.aggregator_address,
    },
    aggregated_price: price,
    last_on_chain_price: "341288000000",
    last_on_chain_at: ISO,
    last_on_chain_tx: summary.last_on_chain_tx,
    last_round_id: "18437",
    sources: price.sources,
    ...overrides,
  };
}

export function makeSubmission(overrides: Partial<SubmissionStatus> = {}): SubmissionStatus {
  return {
    req_id: "42",
    asset_id: "weth",
    tx_hash: "0x3c8e000000000000000000000000000000000000000000000000000000000004df",
    submitted_price: "341288000000",
    submitted_at: ISO,
    status: "confirmed",
    retry_count: 0,
    ...overrides,
  };
}

export function makeRequestSummary(overrides: Partial<RequestSummary> = {}): RequestSummary {
  return {
    req_id: "42",
    asset_id: "weth",
    status: "fulfilled",
    requester: "0x4f3a2B9c00000000000000000000000000009c21",
    requested_tx_hash: "0x7e21000000000000000000000000000000000000000000000000000000000004df",
    fulfilled_tx_hash: "0x3c9f00000000000000000000000000000000000000000000000000000000b2a1",
    fulfilled_price: "341288000000",
    requested_at: ISO,
    fulfilled_at: ISO,
    ...overrides,
  };
}
