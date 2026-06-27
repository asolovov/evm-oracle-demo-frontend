import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/features/copy-button";
import { OnChainRounds } from "@/components/features/on-chain-rounds";
import { OnChainRoundsChain } from "@/components/features/on-chain-rounds-chain";
import { RequestButton } from "@/components/features/request-button";
import { SourceComposition } from "@/components/features/source-composition";
import { explorerAddress } from "@/config/chain";
import { getAggregator, resolveAsset } from "@/config/contracts";
import { ApiError } from "@/lib/api/errors";
import { getAssetPrice, getSubmissions } from "@/lib/api/oracle";
import type { PriceDetail, SubmissionStatus } from "@/lib/api/schemas";
import {
  getOnChainFeed,
  getRecentRounds,
  type OnChainFeed,
  type OnChainRound,
} from "@/lib/chain/reads";
import { formatAge, formatAgeSince, formatOnChainPrice, formatPrice, shorten } from "@/lib/format";

export const dynamic = "force-dynamic";

const MAX_UINT256 = 2n ** 256n - 1n;

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

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-tile)", padding: "14px 16px" }}>
      <div
        style={{ fontSize: 10, letterSpacing: "1.5px", color: "var(--fg-dim)", marginBottom: 6 }}
      >
        {k}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg)", wordBreak: "break-all" }}>{children}</div>
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

  // Read on-chain truth directly (server-side, cached, multicall). Fail-soft.
  const onchain: OnChainFeed | null = await getOnChainFeed(id);
  const rounds: OnChainRound[] = onchain ? await getRecentRounds(id, onchain.roundId, 8) : [];

  const { asset, aggregated_price } = detail;
  const median = aggregated_price.median_price;
  const aggregator = getAggregator(asset.id) ?? asset.aggregator_address;
  const assetIdHash = resolveAsset(asset.id)?.assetId;
  const decimals = onchain?.decimals ?? 8;
  // Request-time timestamp for relative ages; fine in an async Server Component.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  // On-chain answer: prefer the live read, fall back to the BFF's last known.
  const onChainPriceStr = onchain
    ? formatOnChainPrice(onchain.answer.toString(), decimals)
    : formatOnChainPrice(detail.last_on_chain_price, decimals);
  const onChainRoundStr = onchain
    ? `#${onchain.roundId.toString()}`
    : detail.last_round_id
      ? `#${detail.last_round_id}`
      : "—";
  const onChainAgeStr = onchain
    ? `${formatAge(Math.max(0, Math.floor(now / 1000) - Number(onchain.updatedAt)))} ago`
    : formatAgeSince(detail.last_on_chain_at);

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

      {/* Header: symbol + off-chain median + on-chain answer (the two numbers
          the oracle reconciles) + request button. */}
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
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "1px", color: "var(--fg-dim)" }}>
                  OFF-CHAIN MEDIAN
                </div>
                <span
                  style={{
                    fontSize: "clamp(24px,4.5vw,40px)",
                    fontWeight: 700,
                    color: "var(--ac)",
                    textShadow: "0 0 14px var(--acg)",
                  }}
                >
                  {formatPrice(median)}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "1px", color: "var(--fg-dim)" }}>
                  ON-CHAIN ({onChainRoundStr})
                </div>
                <span
                  style={{
                    fontSize: "clamp(20px,4vw,32px)",
                    fontWeight: 700,
                    color: "var(--good)",
                  }}
                >
                  {onChainPriceStr}
                </span>
              </div>
            </div>
          </div>
        </div>
        <RequestButton assetId={asset.id} aggregatorKnown={Boolean(getAggregator(asset.id))} />
      </div>

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
        <MiniStat k="LAST ON-CHAIN PRICE" v={onChainPriceStr} />
        <MiniStat k="LATEST ROUND" v={onChainRoundStr} />
        <MiniStat k="LAST ON-CHAIN UPDATE" v={onChainAgeStr} />
        <MiniStat k="LAST OFF-CHAIN FETCH" v={formatAgeSince(aggregated_price.aggregated_at)} />
      </div>

      <SourceComposition sources={detail.sources} median={median} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: 20,
          marginBottom: 26,
        }}
      >
        <OnChainRoundsChain rounds={rounds} decimals={decimals} now={now} />
        <OnChainRounds submissions={submissions} now={now} />
      </div>

      {/* Contract facts + Chainlink-compatibility callout (all real). */}
      <div
        style={{ border: "1px solid var(--acd)", background: "rgba(0,0,0,0.3)", marginBottom: 20 }}
      >
        <div
          style={{
            padding: "13px 16px",
            borderBottom: "1px solid var(--acd)",
            fontSize: 11,
            letterSpacing: "2px",
            color: "var(--ac)",
          }}
        >
          AGGREGATOR CONTRACT
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 1,
            background: "var(--acd)",
          }}
        >
          <Fact k="ADDRESS">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>{aggregator ? shorten(aggregator, 10, 8) : "not yet observed"}</span>
              {aggregator ? <CopyButton value={aggregator} /> : null}
            </div>
          </Fact>
          <Fact k="ASSET ID (bytes32)">
            {assetIdHash ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span>{shorten(assetIdHash, 10, 8)}</span>
                <CopyButton value={assetIdHash} />
              </div>
            ) : (
              "—"
            )}
          </Fact>
          <Fact k="DECIMALS">{String(decimals)}</Fact>
          <Fact k="TOTAL REQUESTS">{onchain ? onchain.nextReqId.toString() : "—"}</Fact>
          <Fact k="REQUEST FEE">
            {onchain ? (onchain.requestFee === 0n ? "0 (free)" : `${onchain.requestFee} wei`) : "—"}
          </Fact>
          <Fact k="STALENESS GATING">
            {onchain ? (onchain.maxAge === MAX_UINT256 ? "off (demo)" : `${onchain.maxAge}s`) : "—"}
          </Fact>
        </div>
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--acd)",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "1.5px",
                color: "var(--fg-dim)",
                marginBottom: 8,
              }}
            >
              ◇ CHAINLINK AggregatorV3Interface — DROP-IN COMPATIBLE
            </div>
            <pre
              style={{
                margin: 0,
                fontFamily: "inherit",
                fontSize: 11.5,
                lineHeight: 1.6,
                color: "#9ad6a0",
                whiteSpace: "pre",
                overflowX: "auto",
              }}
            >{`(, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(${aggregator ? `${aggregator.slice(0, 10)}…` : "0x…"}).latestRoundData();
// live: answer = ${onChainPriceStr}, ${onChainAgeStr}`}</pre>
          </div>
          {aggregator ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
