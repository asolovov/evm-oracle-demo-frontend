import Link from "next/link";
import { FreshnessDots } from "@/components/features/freshness-dots";
import { Sparkline } from "@/components/features/sparkline";

export type AssetTileData = {
  id: string;
  symbol: string;
  name: string;
  priceStr: string;
  /** Per-source ages in seconds, for the freshness dots. */
  sourceAges: number[];
  sourceCount: number;
  onChainAgeStr: string;
  offChainAgeStr: string;
  /** Median price (or 1) used only to seed the decorative sparkline. */
  sparkBase: number;
};

/** A single asset feed tile on the dashboard. Presentational. */
export function AssetTile({ data, animate = true }: { data: AssetTileData; animate?: boolean }) {
  return (
    <Link
      href={`/assets/${data.id}`}
      className="lh-card"
      data-testid={`asset-tile-${data.id}`}
      style={{
        position: "relative",
        padding: 18,
        overflow: "hidden",
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "var(--ac)",
          opacity: 0.5,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{ fontSize: 16, fontWeight: 700, letterSpacing: "1.5px", color: "var(--fg)" }}
          >
            {data.symbol}
          </div>
          <div
            style={{ fontSize: 10.5, letterSpacing: "1px", color: "var(--fg-dim)", marginTop: 2 }}
          >
            {data.name}
          </div>
        </div>
        <FreshnessDots ages={data.sourceAges} animate={animate} />
      </div>

      <div style={{ marginBottom: 4 }}>
        <span
          style={{
            fontSize: 23,
            fontWeight: 700,
            color: "var(--ac)",
            textShadow: "0 0 9px var(--acg)",
          }}
        >
          {data.priceStr}
        </span>
      </div>

      {/* Reserved slot preserving the design's vertical rhythm (the per-tile
          change % from the design isn't available from the API). */}
      <div style={{ height: 14, marginBottom: 14 }} />

      <div style={{ margin: "0 -2px 14px" }}>
        <Sparkline seed={data.id} base={data.sparkBase} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          fontSize: 10.5,
          letterSpacing: "0.5px",
          color: "var(--fg-dim)",
          borderTop: "1px solid rgba(255,176,0,0.08)",
          paddingTop: 11,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>ON-CHAIN</span>
          <span style={{ color: "var(--fg-muted)" }}>{data.onChainAgeStr}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>OFF-CHAIN</span>
          <span style={{ color: "var(--fg-muted)" }}>{data.offChainAgeStr}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 13,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "1px",
            color: "var(--ac)",
            border: "1px solid var(--acd)",
            padding: "3px 7px",
          }}
        >
          ◇ {data.sourceCount} SRC
        </span>
        <span style={{ fontSize: 11, letterSpacing: "1.5px", color: "var(--ac)" }}>▸ INSPECT</span>
      </div>
    </Link>
  );
}
