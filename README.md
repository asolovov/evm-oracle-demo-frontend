# Lighthouse Oracle — Dashboard

The Next.js front end for the **EVM Oracle Demo**: a pull-based, multi-source price
oracle on Ethereum Sepolia. The dashboard surfaces 10 asset feeds, per-asset
drill-downs with on-chain history, a wallet-signed `requestPrice` flow, and an
author/credentials page. A CRT/terminal aesthetic ties it together.

> ⚠️ **Demo, not production.** Runs on testnets; reporter keys are on-disk in the
> backend. Don't use it to price anything real.

**Built by [Andrei Solovov](https://github.com/asolovov)** ·
[LinkedIn](https://www.linkedin.com/in/andrey-solovov-bb665884/) ·
[GitHub](https://github.com/asolovov) ·
[Source](https://github.com/asolovov/evm-oracle-demo-frontend)

> Agents: read [`AGENTS.md`](./AGENTS.md) first — it's the source of truth for
> conventions, structure, and self-verification.

## What it does

- **Dashboard (`/`)** — 10 asset tiles with aggregated price, on-/off-chain ages,
  per-source freshness dots, and a live-stat strip. Hydrated from the BFF on the
  server, then live-updated over the `/ws/stream` WebSocket.
- **Drill-down (`/assets/[id]`)** — price chart (24h/7d/30d), per-source
  breakdown, recent on-chain submissions, the aggregator address, and the
  wallet-signed **Request Update** button.
- **Request status (`/requests/[reqId]`)** — polls the request lifecycle every 5s
  and renders a signed → processing → fulfilled timeline with the final price.
- **About (`/about`)** — author bio, named credentials, project list, contacts.
- **Footer** on every page links LinkedIn / GitHub / Source (and Upwork when
  `NEXT_PUBLIC_UPWORK_URL` is set).

## Architecture

- **Server-first reads.** Initial data is fetched in Server Components through the
  `server-only` API client (`src/lib/api/client.ts` → `src/lib/api/oracle.ts`),
  every response validated with a Zod schema mirrored from the OpenAPI spec.
- **Client islands** handle realtime + interactivity only: the live WS stream
  (`src/hooks/use-live-stream.ts`), wallet connection (`src/components/wallet/`,
  viem over EIP-1193), and request polling.
- **Calldata is built in the browser** — `requestPrice()` is ABI-encoded against
  the asset's aggregator (addresses + ABI from the contracts deployment, in
  `src/config/contracts.ts` / `src/lib/contracts/`), the `requestFee` is read
  on-chain for `msg.value`, then the wallet signs/broadcasts and we read `reqId`
  from the receipt's `PriceRequested` log. No BFF round-trip for the write path,
  so it doesn't depend on the indexer having observed the registration.
- **API contract** lives in [`docs/api/openapi.yaml`](./docs/api/openapi.yaml)
  (copied from `evm-oracle-demo-api`) — the source of truth for the REST surface.

## Quick start

```bash
pnpm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at the running BFF
pnpm dev
```

Visit <http://localhost:3000>. With the backend down the dashboard still renders
its shell and shows an empty-feeds state.

## Environment variables

| Variable                   | Required | Default                       | Notes |
|----------------------------|----------|-------------------------------|-------|
| `NEXT_PUBLIC_API_URL`      | yes      | —                             | Base URL of the Go BFF. |
| `NEXT_PUBLIC_WS_URL`       | no       | derived from API URL          | WS base for `/ws/stream`. |
| `NEXT_PUBLIC_CHAIN_ID`     | no       | `11155111`                    | Target chain id. |
| `NEXT_PUBLIC_CHAIN_NAME`   | no       | `Ethereum Sepolia`            | Header network pill. |
| `NEXT_PUBLIC_EXPLORER_URL` | no       | `https://sepolia.etherscan.io`| Explorer base, no trailing slash. |
| `NEXT_PUBLIC_UPWORK_URL`   | no       | unset                         | Footer/about Upwork link renders only when set. |

`NEXT_PUBLIC_*` values are inlined at build time — rebuild the image to change them.

## Scripts

```bash
pnpm verify       # typecheck + lint + tests + build (run before any PR)
pnpm dev          # dev server (Turbopack)
pnpm test         # vitest watch
pnpm test:run     # vitest one-shot
pnpm test:e2e     # playwright smoke
pnpm lint:fix     # biome + eslint autofix
```

## Docker

```bash
docker build -t lighthouse-frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example \
  .
docker run -p 3000:3000 lighthouse-frontend
```

Multi-stage build producing a Next.js standalone server on Node 22 Alpine.

## Tests

- **Unit/component** (Vitest + RTL + MSW) co-located as `*.test.ts(x)`: formatting
  + chart + view-model helpers, the API access layer (against MSW), and the
  `FreshnessDots` / `AssetTile` / `Dashboard` / `RequestButton` components.
- **E2E** (Playwright, `tests/e2e/`): landing shell, demo-banner dismissal, footer
  credentials, about page, and a guarded tile→detail drill-down.

## Known gaps

- **Price chart is a synthetic preview.** The API exposes no price-history
  endpoint, so the chart renders a deterministic illustrative series (final point
  anchored to the real current price), labeled as such in the UI.
- Headshot on `/about` is a placeholder until the asset is provided.

## License

MIT
