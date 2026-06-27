"use client";

import { useState } from "react";
import {
  type ChartRange,
  pathGeometry,
  RANGE_POINTS,
  RANGE_VOL,
  RANGE_X_LABELS,
  synthSeries,
} from "@/lib/chart";
import { formatPrice } from "@/lib/format";

const RANGES: ChartRange[] = ["24h", "7d", "30d"];

/**
 * Aggregated-price chart with range toggles. The API has no price-history feed,
 * so the series is an illustrative shape seeded from the asset id + range, with
 * the final point anchored to the real current price. Labeled in the UI so it is
 * never mistaken for real history.
 */
export function PriceChart({
  assetId,
  symbol,
  base,
}: {
  assetId: string;
  symbol: string;
  base: number;
}) {
  const [range, setRange] = useState<ChartRange>("24h");

  const w = 720;
  const h = 220;
  const vals = synthSeries(`${assetId}-${range}`, RANGE_POINTS[range], RANGE_VOL[range], base || 1);
  // Anchor the final ("now") point to the real current price so the endpoint and
  // its marker reflect actual data even though the rest of the line is synthetic.
  if (base > 0 && vals.length > 0) vals[vals.length - 1] = base;
  const { line, area, lastX, lastY } = pathGeometry(vals, w, h);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const yLabels = [formatPrice(max), formatPrice((max + min) / 2), formatPrice(min)];

  return (
    <div
      style={{
        border: "1px solid var(--acd)",
        background: "rgba(0,0,0,0.4)",
        padding: 20,
        marginBottom: 26,
        boxShadow: "inset 0 0 50px -28px var(--acg)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "2px", color: "var(--fg-dim)" }}>
          AGGREGATED PRICE — {symbol}/USD
          <span style={{ color: "var(--fg-faint)", marginLeft: 10, letterSpacing: "1px" }}>
            (synthetic preview · illustrative only)
          </span>
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className="lh-ctl"
              style={{ fontSize: 11, padding: "6px 12px" }}
              aria-pressed={range === r}
            >
              {range === r ? <span style={{ color: "var(--ac)" }}>▸ </span> : null}
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            style={{ width: "100%", height: 220, display: "block" }}
            role="img"
            aria-label={`${symbol} price preview, ${range}`}
          >
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ac)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--ac)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <line
                key={t}
                x1={0}
                x2={w}
                y1={t * h}
                y2={t * h}
                stroke="rgba(255,176,0,0.10)"
                strokeWidth={1}
                strokeDasharray="2 7"
              />
            ))}
            <path d={area} fill="url(#chart-fill)" />
            <path
              d={line}
              fill="none"
              stroke="var(--ac)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle
              cx={lastX}
              cy={lastY}
              r={8}
              fill="none"
              stroke="var(--ac)"
              strokeWidth={1}
              opacity={0.5}
            />
            <circle cx={lastX} cy={lastY} r={3.5} fill="var(--ac)" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontSize: 10.5,
            color: "var(--fg-dim)",
            padding: "2px 0",
            textAlign: "right",
          }}
        >
          {yLabels.map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: "var(--fg-dim)",
          marginTop: 8,
          paddingRight: 60,
        }}
      >
        {RANGE_X_LABELS[range].map((x) => (
          <span key={x}>{x}</span>
        ))}
      </div>
    </div>
  );
}
