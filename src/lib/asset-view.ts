import type { AssetTileData } from "@/components/features/asset-tile";
import type { AssetSummary, SourceContribution } from "@/lib/api/schemas";
import { ageSecondsSince, formatAge, formatPrice } from "@/lib/format";

/** Per-source ages in seconds, preferring the server-reported `age_sec`. */
export function sourceAges(sources: SourceContribution[], now: number = Date.now()): number[] {
  return sources.map((s) =>
    Number.isFinite(s.age_sec) && s.age_sec >= 0 ? s.age_sec : ageSecondsSince(s.fetched_at, now),
  );
}

/** Build the presentational tile model from a catalog summary. */
export function toTileData(summary: AssetSummary, now: number = Date.now()): AssetTileData {
  const price = summary.latest_price;
  const sources = price?.sources ?? [];
  return {
    id: summary.id,
    symbol: summary.symbol,
    name: summary.name,
    priceStr: price ? formatPrice(price.median_price) : "—",
    sourceAges: sourceAges(sources, now),
    sourceCount: sources.length,
    onChainAgeStr: summary.last_on_chain_at
      ? `${formatAge(ageSecondsSince(summary.last_on_chain_at, now))} ago`
      : "never",
    offChainAgeStr: price ? `${formatAge(ageSecondsSince(price.aggregated_at, now))} ago` : "—",
    sparkBase: price?.median_price ?? 1,
  };
}
