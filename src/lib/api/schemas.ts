import { z } from "zod";

/**
 * Zod schemas mirroring `docs/api/openapi.yaml` (the copied source of truth for
 * the `evm-oracle-demo-api` BFF). Every `api.*()` response is validated against
 * one of these at the boundary. Keep these in sync with the OpenAPI file.
 */

export const assetClassSchema = z.enum(["crypto", "rwa"]);
export type AssetClass = z.infer<typeof assetClassSchema>;

export const assetSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  class: assetClassSchema,
  aggregator_address: z.string().optional(),
});
export type Asset = z.infer<typeof assetSchema>;

export const sourceContributionSchema = z.object({
  source: z.string(),
  price: z.number(),
  fetched_at: z.string(),
  source_observed_at: z.string().optional(),
  age_sec: z.number().int(),
  included: z.boolean(),
});
export type SourceContribution = z.infer<typeof sourceContributionSchema>;

export const aggregatedPriceSchema = z.object({
  asset_id: z.string(),
  median_price: z.number(),
  aggregated_at: z.string(),
  sources: z.array(sourceContributionSchema),
});
export type AggregatedPrice = z.infer<typeof aggregatedPriceSchema>;

export const assetSummarySchema = assetSchema.extend({
  latest_price: aggregatedPriceSchema.optional(),
  last_on_chain_price: z.string().optional(),
  last_on_chain_at: z.string().optional(),
  last_on_chain_tx: z.string().optional(),
});
export type AssetSummary = z.infer<typeof assetSummarySchema>;

export const assetsResponseSchema = z.object({
  assets: z.array(assetSummarySchema),
});
export type AssetsResponse = z.infer<typeof assetsResponseSchema>;

export const priceDetailSchema = z.object({
  asset: assetSchema,
  aggregated_price: aggregatedPriceSchema,
  last_on_chain_price: z.string().optional(),
  last_on_chain_at: z.string().optional(),
  last_on_chain_tx: z.string().optional(),
  last_round_id: z.string().optional(),
  sources: z.array(sourceContributionSchema),
});
export type PriceDetail = z.infer<typeof priceDetailSchema>;

export const requestStatusKindSchema = z.enum(["", "pending", "fulfilled", "failed"]);
export type RequestStatusKind = z.infer<typeof requestStatusKindSchema>;

export const requestSummarySchema = z.object({
  req_id: z.string(),
  asset_id: z.string(),
  status: requestStatusKindSchema,
  requester: z.string(),
  requested_tx_hash: z.string(),
  fulfilled_tx_hash: z.string().optional(),
  fulfilled_price: z.string().optional(),
  requested_at: z.string().optional(),
  fulfilled_at: z.string().optional(),
});
export type RequestSummary = z.infer<typeof requestSummarySchema>;

export const buildTxResponseSchema = z.object({
  to: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "expected a 20-byte hex address"),
  data: z.string().regex(/^0x[0-9a-fA-F]*$/, "expected 0x-prefixed hex calldata"),
  value: z.string().regex(/^\d+$/, "expected a base-10 wei value"),
  chain_id: z.number().int(),
  chain_name: z.string().optional(),
});
export type BuildTxResponse = z.infer<typeof buildTxResponseSchema>;

export const submissionStatusKindSchema = z.enum([
  "",
  "pending",
  "confirmed",
  "failed",
  "dropped",
  "expired",
]);
export type SubmissionStatusKind = z.infer<typeof submissionStatusKindSchema>;

export const submissionStatusSchema = z.object({
  req_id: z.string(),
  asset_id: z.string(),
  tx_hash: z.string().optional(),
  submitted_price: z.string().optional(),
  submitted_at: z.string().optional(),
  status: submissionStatusKindSchema,
  retry_count: z.number().int(),
  last_error: z.string().optional(),
});
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const pageInfoSchema = z.object({
  number: z.number().int(),
  size: z.number().int(),
  total_items: z.number().int(),
  total_pages: z.number().int(),
});
export type PageInfo = z.infer<typeof pageInfoSchema>;

export const submissionsResponseSchema = z.object({
  submissions: z.array(submissionStatusSchema),
  page: pageInfoSchema,
});
export type SubmissionsResponse = z.infer<typeof submissionsResponseSchema>;

// --- WebSocket envelope (see internal/wshub/wire.go in evm-oracle-demo-api) ---

export const wsPriceMessageSchema = z.object({
  type: z.literal("price"),
  payload: aggregatedPriceSchema,
});

export const eventKindSchema = z.enum([
  "",
  "PRICE_REQUESTED",
  "PRICE_FULFILLED",
  "ASSET_REGISTERED",
]);
export type EventKind = z.infer<typeof eventKindSchema>;

export const eventSchema = z.object({
  meta: z
    .object({
      contract_address: z.string().optional(),
      tx_hash: z.string().optional(),
      block_number: z.number().int().optional(),
    })
    .partial()
    .optional(),
  kind: eventKindSchema,
  price_requested: z
    .object({ req_id: z.string(), asset_id: z.string(), requester: z.string() })
    .optional(),
  price_fulfilled: z
    .object({
      req_id: z.string(),
      asset_id: z.string(),
      price: z.string(),
      timestamp: z.string(),
      round_id: z.string(),
    })
    .optional(),
  asset_registered: z.object({ asset_id: z.string(), aggregator: z.string() }).optional(),
});
export type IndexerEvent = z.infer<typeof eventSchema>;

export const wsEventMessageSchema = z.object({
  type: z.literal("event"),
  payload: eventSchema,
});

export const wsMessageSchema = z.discriminatedUnion("type", [
  wsPriceMessageSchema,
  wsEventMessageSchema,
]);
export type WsMessage = z.infer<typeof wsMessageSchema>;
