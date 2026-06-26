import { HttpResponse, http } from "msw";
import {
  ASSET_CATALOG,
  makePriceDetail,
  makeRequestSummary,
  makeSubmission,
} from "@/test/fixtures";

/**
 * Default handlers for the `evm-oracle-demo-api` BFF (see docs/api/openapi.yaml).
 * Override per-test via `server.use(...)`.
 */
export const handlers = [
  http.get("*/api/v1/health", () =>
    HttpResponse.json({
      status: "ok",
      service: "evm-oracle-demo-api",
      version: "v1.0.0",
      author: { name: "Andrei Solovov" },
    }),
  ),

  http.get("*/api/v1/assets", () => HttpResponse.json({ assets: ASSET_CATALOG })),

  http.get("*/api/v1/assets/:id/price", ({ params }) => {
    const id = String(params.id);
    const known = ASSET_CATALOG.find((a) => a.id === id);
    if (!known) {
      return HttpResponse.json(
        { code: "asset_not_tracked", message: "asset is not tracked" },
        { status: 404 },
      );
    }
    return HttpResponse.json(
      makePriceDetail({
        asset: { id: known.id, symbol: known.symbol, name: known.name, class: known.class },
      }),
    );
  }),

  http.get("*/api/v1/assets/:id/history", () =>
    HttpResponse.json(
      { code: "not_implemented", message: "history endpoint not yet implemented" },
      { status: 501 },
    ),
  ),

  http.get("*/api/v1/requests/:reqId", ({ params }) => {
    const reqId = String(params.reqId);
    return HttpResponse.json(makeRequestSummary({ req_id: reqId }));
  }),

  http.post("*/api/v1/requests/build-tx", async ({ request }) => {
    const body = (await request.json()) as { asset_id?: string };
    const known = ASSET_CATALOG.find((a) => a.id === body.asset_id);
    if (!known) {
      return HttpResponse.json(
        { code: "asset_not_tracked", message: "asset is not tracked" },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      to: known.aggregator_address ?? "0x0000000000000000000000000000000000000000",
      data: "0xdeadbeef",
      value: "0",
      chain_id: 11155111,
      chain_name: "ethereum-sepolia",
    });
  }),

  http.get("*/api/v1/submissions", () =>
    HttpResponse.json({
      submissions: [
        makeSubmission({ req_id: "42" }),
        makeSubmission({
          req_id: "0",
          tx_hash: "0xabc0000000000000000000000000000000000000000000000000000000000111",
        }),
      ],
      page: { number: 1, size: 25, total_items: 2, total_pages: 1 },
    }),
  ),

  http.get("*/api/v1/submissions/:id", ({ params }) =>
    HttpResponse.json(makeSubmission({ req_id: String(params.id) })),
  ),
];
