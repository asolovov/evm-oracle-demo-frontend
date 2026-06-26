"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetTile } from "@/components/features/asset-tile";
import { type LiveStreamStatus, useLiveStream } from "@/hooks/use-live-stream";
import type { AggregatedPrice, AssetSummary } from "@/lib/api/schemas";
import { toTileData } from "@/lib/asset-view";

/** Live on-chain context patched in from PRICE_FULFILLED stream frames. */
type OnChainPatch = { price: string | undefined; tx: string | undefined; at: string };

type Stat = { k: string; v: string };

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
        gap: 1,
        background: "var(--acd)",
        border: "1px solid var(--acd)",
        marginBottom: 40,
      }}
    >
      {stats.map((s) => (
        <div key={s.k} style={{ background: "var(--bg-tile)", padding: "16px 18px" }}>
          <div
            style={{ fontSize: 10, letterSpacing: "2px", color: "var(--fg-dim)", marginBottom: 7 }}
          >
            {s.k}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--ac)",
              textShadow: "0 0 8px var(--acg)",
            }}
          >
            {s.v}
          </div>
        </div>
      ))}
    </div>
  );
}

const STREAM_LABEL: Record<LiveStreamStatus, string> = {
  connecting: "CONNECTING…",
  open: "● LIVE",
  closed: "OFFLINE",
};

/**
 * Live dashboard grid. Hydrates from the server-fetched catalog, then layers
 * `price` frames from the WS stream on top (keyed by asset id) and re-renders
 * relative ages on a 1s tick.
 */
export function Dashboard({ initialAssets }: { initialAssets: AssetSummary[] }) {
  const [priceOverrides, setPriceOverrides] = useState<Record<string, AggregatedPrice>>({});
  const [onChainPatches, setOnChainPatches] = useState<Record<string, OnChainPatch>>({});
  const [now, setNow] = useState<number>(() => Date.now());

  const status = useLiveStream({
    onPrice: (price) => setPriceOverrides((prev) => ({ ...prev, [price.asset_id]: price })),
    onEvent: (event) => {
      // A confirmed on-chain price write — refresh the tile's on-chain context.
      if (event.kind !== "PRICE_FULFILLED" || !event.price_fulfilled) return;
      const { asset_id, price } = event.price_fulfilled;
      const at = new Date().toISOString();
      setOnChainPatches((prev) => ({
        ...prev,
        [asset_id]: { price, tx: event.meta?.tx_hash, at },
      }));
    },
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const assets = useMemo(
    () =>
      initialAssets.map((a) => {
        const priceOverride = priceOverrides[a.id];
        const patch = onChainPatches[a.id];
        return {
          ...a,
          ...(priceOverride ? { latest_price: priceOverride } : {}),
          ...(patch
            ? {
                last_on_chain_price: patch.price ?? a.last_on_chain_price,
                last_on_chain_tx: patch.tx ?? a.last_on_chain_tx,
                last_on_chain_at: patch.at,
              }
            : {}),
        };
      }),
    [initialAssets, priceOverrides, onChainPatches],
  );

  const priced = assets.filter((a) => a.latest_price).length;
  const distinctSources = new Set(
    assets.flatMap((a) => a.latest_price?.sources.map((s) => s.source) ?? []),
  ).size;
  const stats: Stat[] = [
    { k: "ASSETS TRACKED", v: String(assets.length) },
    { k: "FEEDS PRICED", v: `${priced} / ${assets.length}` },
    { k: "SOURCES", v: distinctSources > 0 ? String(distinctSources) : "—" },
    { k: "STREAM", v: STREAM_LABEL[status] },
  ];

  return (
    <>
      <StatGrid stats={stats} />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, letterSpacing: "2px", color: "var(--fg-dim)" }}>
          root@lighthouse:~$ ls ./assets
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--acd)", minWidth: 30 }} />
        <span style={{ fontSize: 11, letterSpacing: "2px", color: "var(--ac)" }}>
          {assets.length} FEEDS · {status === "open" ? "LIVE" : "CACHED"}
        </span>
      </div>

      {assets.length === 0 ? (
        <div
          style={{
            border: "1px solid var(--acd)",
            padding: 40,
            textAlign: "center",
            color: "var(--fg-dim)",
            fontSize: 13,
            letterSpacing: "1px",
          }}
        >
          No feeds available. Is the API reachable?
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 16,
          }}
        >
          {assets.map((a) => (
            <AssetTile key={a.id} data={toTileData(a, now)} />
          ))}
        </div>
      )}
    </>
  );
}
