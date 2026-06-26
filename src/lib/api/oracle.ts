import "server-only";
import { api } from "@/lib/api/client";
import {
  type AssetsResponse,
  assetsResponseSchema,
  type BuildTxResponse,
  buildTxResponseSchema,
  type PriceDetail,
  priceDetailSchema,
  type RequestSummary,
  requestSummarySchema,
  type SubmissionsResponse,
  submissionsResponseSchema,
} from "@/lib/api/schemas";

/**
 * Typed server-side access to the `evm-oracle-demo-api` BFF. Every call validates
 * the response against the Zod schema mirrored from docs/api/openapi.yaml. These
 * run only on the server (Server Components / Server Actions) — the underlying
 * client is `server-only`.
 */

/** GET /api/v1/assets — the 10-asset catalog with latest price + on-chain context. */
export function getAssets(): Promise<AssetsResponse> {
  // No caching: prices are live. The dashboard layers WS updates on top.
  return api.get("/api/v1/assets", assetsResponseSchema, { cache: "no-store" });
}

/** GET /api/v1/assets/{id}/price — drill-down price detail + per-source breakdown. */
export function getAssetPrice(id: string): Promise<PriceDetail> {
  return api.get(`/api/v1/assets/${encodeURIComponent(id)}/price`, priceDetailSchema, {
    cache: "no-store",
  });
}

/** GET /api/v1/requests/{reqId} — lifecycle status of a single price request. */
export function getRequest(reqId: string): Promise<RequestSummary> {
  return api.get(`/api/v1/requests/${encodeURIComponent(reqId)}`, requestSummarySchema, {
    cache: "no-store",
  });
}

/** GET /api/v1/submissions — paginated oracle submission history (newest first). */
export function getSubmissions(params?: {
  assetId?: string;
  page?: number;
  pageSize?: number;
}): Promise<SubmissionsResponse> {
  return api.get("/api/v1/submissions", submissionsResponseSchema, {
    cache: "no-store",
    query: {
      asset_id: params?.assetId,
      page: params?.page,
      page_size: params?.pageSize,
    },
  });
}

/** POST /api/v1/requests/build-tx — ABI-encoded `requestPrice` calldata to sign. */
export function buildRequestTx(assetId: string, chainId?: number): Promise<BuildTxResponse> {
  return api.post("/api/v1/requests/build-tx", buildTxResponseSchema, {
    asset_id: assetId,
    ...(chainId !== undefined ? { chain_id: chainId } : {}),
  });
}
