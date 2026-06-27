import { Dashboard, type ServerStats } from "@/components/features/dashboard";
import { type BootInfo, LiveTerminal } from "@/components/features/live-terminal";
import { env } from "@/env";
import { getAssets, getSubmissions } from "@/lib/api/oracle";
import type { AssetSummary } from "@/lib/api/schemas";
import {
  getAllLatestRounds,
  getLatestBlock,
  getReporterFunding,
  getReporterSet,
} from "@/lib/chain/reads";
import { buildReporterFunds, type ReporterFund } from "@/lib/reporter-funding";
import { submissionToLine, type TerminalLine } from "@/lib/terminal-line";

// Prices are live; never statically cache this route.
export const dynamic = "force-dynamic";

const LIGHTHOUSE_ASCII = `      _____
     /[ ☼ ]\\
     |=====|
     | | | |
    /|  |  |\\
   / |  |  | \\
  /__|__|__|__\\
     |     |
     |  I  |
    _|_____|_
   /=========\\
  /___________\\
  ~ ~ ~ ~ ~ ~ ~`;

export default async function LandingPage() {
  // Everything below is real + fail-soft. BFF reads (assets, submissions) and
  // on-chain reads (reporter set, total requests, block) run in parallel.
  let assets: AssetSummary[] = [];
  try {
    assets = (await getAssets()).assets;
  } catch {
    assets = [];
  }

  let seed: TerminalLine[] = [];
  let sampleTxHash: string | undefined;
  try {
    const { submissions } = await getSubmissions({ pageSize: 12 });
    // Newest-first from the API → reverse so the newest sits at the bottom.
    seed = submissions.map(submissionToLine).reverse();
    // A real confirmed fulfilment, to measure the average tx cost from its receipt.
    sampleTxHash = submissions.find((s) => s.status === "confirmed" && s.tx_hash)?.tx_hash;
  } catch {
    seed = [];
  }

  const [reporterSet, allRounds, block] = await Promise.all([
    getReporterSet(),
    getAllLatestRounds(),
    getLatestBlock(),
  ]);

  // Reporter funding runway (depends on the reporter set).
  const funding = reporterSet
    ? await getReporterFunding(reporterSet.reporters, sampleTxHash)
    : null;
  const reporterFunds: ReporterFund[] =
    funding && reporterSet
      ? buildReporterFunds(
          reporterSet.reporters.map((a) => ({ address: a, balanceWei: funding.balances[a] ?? 0n })),
          funding.avgTxCostWei,
          env.REPORTER_WARN_TXS,
          env.REPORTER_RED_TXS,
        )
      : [];

  const totalRequests = Object.values(allRounds).reduce((sum, r) => sum + Number(r.nextReqId), 0);
  const blockStr = block !== null ? block.toString() : null;

  const serverStats: ServerStats = {
    ...(reporterSet
      ? { reporters: reporterSet.reporters.length, threshold: reporterSet.threshold }
      : {}),
    totalRequests,
    block: blockStr,
  };

  const boot: BootInfo = {
    reporters: reporterSet?.reporters.length ?? 0,
    threshold: reporterSet?.threshold ?? 0,
    block: blockStr,
    assetCount: assets.length,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 38,
          flexWrap: "wrap",
          alignItems: "flex-start",
          marginBottom: 44,
        }}
      >
        <div style={{ flex: 1, minWidth: 300 }}>
          <div
            style={{ fontSize: 11, letterSpacing: "4px", color: "var(--fg-dim)", marginBottom: 14 }}
          >
            root@lighthouse:~$ ./start --watch
          </div>
          <h1
            style={{
              fontSize: "clamp(34px,6.5vw,68px)",
              fontWeight: 800,
              letterSpacing: "2px",
              lineHeight: 0.98,
              margin: "0 0 18px",
              color: "var(--ac)",
              textShadow: "0 0 18px var(--acg)",
              animation: "bootglow 4s ease-in-out infinite",
            }}
          >
            LIGHTHOUSE
            <br />
            <span
              style={{ color: "var(--fg)", textShadow: "none", WebkitTextStroke: "1px var(--acd)" }}
            >
              ORACLE
            </span>
          </h1>
          <p
            style={{
              fontSize: "clamp(13px,1.7vw,16px)",
              lineHeight: 1.65,
              color: "var(--fg-muted)",
              maxWidth: 520,
              margin: "0 0 26px",
            }}
          >
            A multi-source price oracle that reads many feeds, agrees on one number, and writes it
            on-chain. <span style={{ color: "var(--ac)" }}>On-chain truth</span>, off-chain speed —
            verifiable to the round.
          </p>
          <LiveTerminal boot={boot} seed={seed} reporterFunds={reporterFunds} />
        </div>

        <div style={{ flexShrink: 0, position: "relative", padding: "18px 10px" }}>
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 30,
              left: "50%",
              width: 160,
              height: 34,
              transformOrigin: "left center",
              background: "linear-gradient(90deg,var(--acg),transparent)",
              filter: "blur(6px)",
              animation: "beam 3.5s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <pre
            style={{
              margin: 0,
              fontFamily: "inherit",
              fontSize: 13,
              lineHeight: 1.25,
              color: "var(--ac)",
              textShadow: "0 0 10px var(--acg)",
              position: "relative",
            }}
          >
            {LIGHTHOUSE_ASCII}
          </pre>
        </div>
      </div>

      <Dashboard initialAssets={assets} serverStats={serverStats} />
    </div>
  );
}
