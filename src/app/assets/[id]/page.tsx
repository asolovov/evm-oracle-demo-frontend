import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/features/copy-button";
import { OnChainRounds } from "@/components/features/on-chain-rounds";
import { PriceChart } from "@/components/features/price-chart";
import { RequestButton } from "@/components/features/request-button";
import { SourceBreakdown } from "@/components/features/source-breakdown";
import { explorerAddress } from "@/config/chain";
import { getAggregator } from "@/config/contracts";
import { ApiError } from "@/lib/api/errors";
import { getAssetPrice, getSubmissions } from "@/lib/api/oracle";
import type { PriceDetail, SubmissionStatus } from "@/lib/api/schemas";
import { formatAgeSince, formatOnChainPrice, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id.toUpperCase()} — Lighthouse Oracle` };
}

function MiniStat({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ background: "var(--bg-tile)", padding: "14px 16px" }}>
      <div
        style={{ fontSize: 10, letterSpacing: "1.5px", color: "var(--fg-dim)", marginBottom: 6 }}
      >
        {k}
      </div>
      <div style={{ fontSize: 15, color: "var(--fg)" }}>{v}</div>
    </div>
  );
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let detail: PriceDetail;
  try {
    detail = await getAssetPrice(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let submissions: SubmissionStatus[] = [];
  try {
    submissions = (await getSubmissions({ assetId: id, pageSize: 8 })).submissions;
  } catch {
    submissions = [];
  }

  const { asset, aggregated_price } = detail;
  const price = aggregated_price.median_price;
  // Prefer the deployment-config address (always known) over the BFF's field,
  // which depends on the indexer having observed the registration.
  const aggregator = getAggregator(asset.id) ?? asset.aggregator_address;
  // Request-time timestamp for relative ages; fine in an async Server Component.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div>
      <Link
        href="/"
        className="lh-nav"
        style={{
          display: "inline-block",
          fontSize: 12,
          letterSpacing: "1.5px",
          marginBottom: 22,
          border: "none",
          padding: 0,
        }}
      >
        ← cd ../assets
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--acd)",
          paddingBottom: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{ fontSize: 11, letterSpacing: "2px", color: "var(--fg-dim)", marginBottom: 8 }}
          >
            {"FEED // "}
            {asset.name}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px,5vw,46px)",
                fontWeight: 800,
                letterSpacing: "2px",
                color: "var(--fg)",
              }}
            >
              {asset.symbol}
            </h1>
            <span
              style={{
                fontSize: "clamp(26px,5vw,42px)",
                fontWeight: 700,
                color: "var(--ac)",
                textShadow: "0 0 14px var(--acg)",
              }}
            >
              {formatPrice(price)}
            </span>
          </div>
        </div>
        <RequestButton assetId={asset.id} aggregatorKnown={Boolean(getAggregator(asset.id))} />
      </div>

      <PriceChart assetId={asset.id} symbol={asset.symbol} base={price} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 1,
          background: "var(--acd)",
          border: "1px solid var(--acd)",
          marginBottom: 26,
        }}
      >
        <MiniStat k="LAST ON-CHAIN PRICE" v={formatOnChainPrice(detail.last_on_chain_price)} />
        <MiniStat k="LATEST ROUND" v={detail.last_round_id ? `#${detail.last_round_id}` : "—"} />
        <MiniStat k="LAST ON-CHAIN UPDATE" v={formatAgeSince(detail.last_on_chain_at)} />
        <MiniStat k="LAST OFF-CHAIN FETCH" v={formatAgeSince(aggregated_price.aggregated_at)} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 20,
          marginBottom: 26,
        }}
      >
        <SourceBreakdown sources={detail.sources} />
        <OnChainRounds submissions={submissions} now={now} />
      </div>

      <div
        style={{
          border: "1px solid var(--acd)",
          background: "rgba(0,0,0,0.3)",
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 10, letterSpacing: "2px", color: "var(--fg-dim)" }}>
          AGGREGATOR CONTRACT
        </span>
        <span
          style={{
            fontSize: 13,
            color: "var(--fg)",
            letterSpacing: "0.5px",
            flex: 1,
            minWidth: 200,
          }}
        >
          {aggregator || "not yet observed"}
        </span>
        {aggregator ? (
          <>
            <CopyButton value={aggregator} />
            <a
              href={explorerAddress(aggregator)}
              target="_blank"
              rel="noopener noreferrer"
              className="lh-linkbtn"
              style={{
                fontSize: 10.5,
                letterSpacing: "1px",
                padding: "6px 12px",
                color: "var(--link)",
              }}
            >
              EXPLORER ↗
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}
