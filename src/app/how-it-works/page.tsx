import type { Metadata } from "next";
import Link from "next/link";
import { explorerAddress } from "@/config/chain";
import { getAggregator } from "@/config/contracts";
import { getAssetPrice, getSubmissions } from "@/lib/api/oracle";
import type { PriceDetail, SubmissionStatus } from "@/lib/api/schemas";
import { getOnChainFeed, getReporterSet } from "@/lib/chain/reads";
import { formatAge, formatOnChainPrice, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How it works — Lighthouse Oracle",
  description:
    "How the Lighthouse Oracle pulls multi-source prices on-chain: aggregation, M-of-N signed fulfilment, and Chainlink AggregatorV3 compatibility.",
};

const ARCHITECTURE = `  wallet / consumer
        │ requestPrice()
        ▼
  PriceAggregator ──emits──▶ indexer-service ──StreamEvents──▶ oracle-service
   (on Sepolia)             (WS, emit-on-ingest)            (2-of-3 EIP-712 signer)
        ▲                                                        │ fetch median
        └──────────────── fulfillPrice(price, sigs[]) ◀──────────┤
                                                                 ▼
                                                          price-service
                                                       (median of N sources)
        BFF (REST + WS)  ◀── price.Subscribe + indexer.StreamEvents
              ▲
              │ this dashboard`;

function Prompt({ cmd }: { cmd: string }) {
  return (
    <div
      style={{ fontSize: 13, letterSpacing: "2px", color: "var(--fg-dim)", margin: "34px 0 14px" }}
    >
      <span style={{ color: "var(--fg-muted)" }}>root@lighthouse:~$</span> {cmd}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--acd)", background: "rgba(0,0,0,0.3)", padding: 18 }}>
      {children}
    </div>
  );
}

const P: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.7,
  color: "var(--fg-muted)",
  margin: "0 0 12px",
};

export default async function HowItWorksPage() {
  const [reporterSet, sampleFeed] = await Promise.all([getReporterSet(), getOnChainFeed("weth")]);

  let sample: PriceDetail | null = null;
  try {
    sample = await getAssetPrice("weth");
  } catch {
    sample = null;
  }

  let recent: SubmissionStatus | null = null;
  try {
    const { submissions } = await getSubmissions({ pageSize: 25 });
    recent =
      submissions.find(
        (s) => s.req_id !== "0" && /^\d+$/.test(s.req_id) && s.status === "confirmed",
      ) ??
      submissions.find((s) => s.req_id !== "0" && /^\d+$/.test(s.req_id)) ??
      null;
  } catch {
    recent = null;
  }

  const aggregator = getAggregator("weth");
  // Request-time timestamp for the relative "updated N ago"; fine in an async
  // Server Component.
  // eslint-disable-next-line react-hooks/purity
  const nowSec = Math.floor(Date.now() / 1000);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div style={{ fontSize: 11, letterSpacing: "3px", color: "var(--fg-dim)", marginBottom: 8 }}>
        {"// PROTOCOL"}
      </div>
      <h1
        style={{
          margin: "0 0 14px",
          fontSize: "clamp(28px,5vw,44px)",
          fontWeight: 800,
          letterSpacing: "1px",
          color: "var(--ac)",
          textShadow: "0 0 14px var(--acg)",
        }}
      >
        HOW IT WORKS
      </h1>
      <p style={{ ...P, maxWidth: 620 }}>
        A pull-based, multi-source price oracle: anyone can request a fresh price on-chain; an
        off-chain pipeline aggregates independent sources, signs the result with an M-of-N reporter
        set, and writes it back in a Chainlink-compatible feed.
      </p>

      {/* Architecture */}
      <Prompt cmd="cat ./architecture" />
      <Panel>
        <pre
          style={{
            margin: 0,
            fontFamily: "inherit",
            fontSize: 12,
            lineHeight: 1.5,
            color: "var(--ac)",
            overflowX: "auto",
          }}
        >
          {ARCHITECTURE}
        </pre>
      </Panel>

      {/* Lifecycle (real example) */}
      <Prompt cmd="explain ./pull-lifecycle" />
      <Panel>
        <ol style={{ margin: 0, paddingLeft: 20, ...P }}>
          <li>
            A consumer calls <code style={{ color: "var(--ac)" }}>requestPrice()</code> on its
            aggregator → emits <code style={{ color: "var(--ac)" }}>PriceRequested(reqId)</code>.
          </li>
          <li>
            The indexer observes the log over WebSocket and streams it on-ingest (no confirmation
            gate).
          </li>
          <li>
            The oracle-service consumes the stream, fetches the aggregated median from
            price-service.
          </li>
          <li>
            It converts the double → int256 (8-decimal), and signs{" "}
            <code style={{ color: "var(--ac)" }}>Price(reqId, assetId, price, timestamp)</code>{" "}
            (EIP-712) with each reporter key.
          </li>
          <li>
            It submits <code style={{ color: "var(--ac)" }}>fulfillPrice(...)</code>; the contract
            verifies ≥ threshold signatures and opens a new round → emits{" "}
            <code style={{ color: "var(--ac)" }}>PriceFulfilled</code>.
          </li>
        </ol>
        {recent ? (
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--fg-dim)" }}>
            Live example —{" "}
            <Link
              href={`/requests/${recent.req_id}`}
              style={{ color: "var(--link)", textDecoration: "none" }}
            >
              request #{recent.req_id} ↗
            </Link>{" "}
            fulfilled at {formatOnChainPrice(recent.submitted_price)} ({recent.status}).
          </div>
        ) : null}
      </Panel>

      {/* Reporter set (live) */}
      <Prompt cmd="cat ./reporters" />
      <Panel>
        <p style={P}>
          Every update needs{" "}
          <strong style={{ color: "var(--fg)" }}>
            ≥ {reporterSet?.threshold ?? "M"} of {reporterSet?.reporters.length ?? "N"}
          </strong>{" "}
          independent ECDSA signatures (EIP-712). The reporter set is on-chain and verifiable:
        </p>
        {reporterSet ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reporterSet.reporters.map((addr, i) => (
              <a
                key={addr}
                href={explorerAddress(addr)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--link)", textDecoration: "none", fontSize: 13 }}
              >
                reporter {i + 1}: {addr} ↗
              </a>
            ))}
          </div>
        ) : (
          <p style={{ ...P, margin: 0 }}>Reporter set unavailable (RPC unreachable).</p>
        )}
      </Panel>

      {/* Aggregation (live) */}
      <Prompt cmd="explain ./aggregation" />
      <Panel>
        <p style={P}>
          price-service polls independent free-tier sources per asset (crypto ~every 3 min, RWA
          ~every 12 h), takes the <strong style={{ color: "var(--fg)" }}>median</strong>, and
          applies a <strong style={{ color: "var(--fg)" }}>10% deviation guard</strong> that rejects
          a round if the median jumps &gt;10% from the last. Source ages are shown but never gate in
          this demo.
        </p>
        {sample?.sources.length ? (
          <div style={{ fontSize: 12.5, color: "var(--fg-dim)" }}>
            Live for {sample.asset.symbol}: median{" "}
            {formatPrice(sample.aggregated_price.median_price)} from{" "}
            {sample.sources.map((s) => s.source.replace(/_/g, " ")).join(", ")}.
          </div>
        ) : null}
      </Panel>

      {/* Chainlink compatibility (live) */}
      <Prompt cmd="cat ./chainlink-compatibility" />
      <Panel>
        <p style={P}>
          Each feed implements the Chainlink{" "}
          <code style={{ color: "var(--ac)" }}>AggregatorV3Interface</code> — any existing consumer
          can read it unchanged:
        </p>
        <pre
          style={{
            margin: 0,
            padding: "14px 16px",
            border: "1px solid var(--acd)",
            background: "rgba(0,0,0,0.4)",
            fontFamily: "inherit",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#9ad6a0",
            overflowX: "auto",
          }}
        >{`(, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(${aggregator ? `${aggregator.slice(0, 12)}…` : "0x…"}).latestRoundData();`}</pre>
        {sampleFeed ? (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--fg-dim)" }}>
            Live read (WETH): answer ={" "}
            <span style={{ color: "var(--good)" }}>
              {formatOnChainPrice(sampleFeed.answer.toString(), sampleFeed.decimals)}
            </span>
            , round #{sampleFeed.roundId.toString()}, updated{" "}
            {formatAge(Math.max(0, nowSec - Number(sampleFeed.updatedAt)))} ago.
          </div>
        ) : null}
      </Panel>

      {/* Honesty box */}
      <Prompt cmd="cat ./demo-simplifications" />
      <Panel>
        <ul style={{ margin: 0, paddingLeft: 20, ...P }}>
          <li>Testnet only (Ethereum Sepolia); reporter keys live on disk on a single VPS.</li>
          <li>
            Source freshness is shown but does not gate updates (a strict mode exists, off by
            default).
          </li>
          <li>
            On-chain rounds are sparse (one per fulfilment); history is read live from the chain.
          </li>
        </ul>
      </Panel>

      <div style={{ height: 40 }} />
    </div>
  );
}
