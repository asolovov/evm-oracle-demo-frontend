import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/components/features/dashboard";
import type { AggregatedPrice, IndexerEvent } from "@/lib/api/schemas";
import { ASSET_CATALOG, makeAssetSummary } from "@/test/fixtures";

// Capture the live-stream handlers so the test can drive WS frames directly.
const captured = vi.hoisted(() => ({
  onPrice: undefined as ((p: AggregatedPrice) => void) | undefined,
  onEvent: undefined as ((e: IndexerEvent) => void) | undefined,
}));

vi.mock("@/hooks/use-live-stream", () => ({
  useLiveStream: (handlers: {
    onPrice?: (p: AggregatedPrice) => void;
    onEvent?: (e: IndexerEvent) => void;
  }) => {
    captured.onPrice = handlers.onPrice;
    captured.onEvent = handlers.onEvent;
    return "open";
  },
}));

describe("Dashboard", () => {
  it("renders a tile per asset and the summary stats", () => {
    render(<Dashboard initialAssets={ASSET_CATALOG} />);
    expect(screen.getByTestId("asset-tile-weth")).toBeInTheDocument();
    expect(screen.getByTestId("asset-tile-hg")).toBeInTheDocument();
    expect(screen.getByText("ASSETS TRACKED")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
  });

  it("shows an empty state when there are no feeds", () => {
    render(<Dashboard initialAssets={[]} />);
    expect(screen.getByText(/No feeds available/i)).toBeInTheDocument();
  });

  it("renders real server stats (reporters, total requests, block)", () => {
    render(
      <Dashboard
        initialAssets={[makeAssetSummary()]}
        serverStats={{ reporters: 3, threshold: 2, totalRequests: 8, block: "6284193" }}
      />,
    );
    expect(screen.getByText("REPORTERS")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("#6284193")).toBeInTheDocument();
  });

  it("merges a live price frame into the matching tile", () => {
    render(<Dashboard initialAssets={[makeAssetSummary()]} />);
    const tile = screen.getByTestId("asset-tile-weth");
    expect(tile).toHaveTextContent("$3,412.88");

    act(() => {
      captured.onPrice?.({
        asset_id: "weth",
        median_price: 5000,
        aggregated_at: "2026-06-26T12:00:00.000Z",
        sources: [
          {
            source: "coingecko",
            price: 5000,
            fetched_at: "2026-06-26T12:00:00.000Z",
            age_sec: 1,
            included: true,
          },
        ],
      });
    });

    expect(screen.getByTestId("asset-tile-weth")).toHaveTextContent("$5,000.00");
  });

  it("refreshes on-chain context on a PRICE_FULFILLED event", () => {
    render(<Dashboard initialAssets={[makeAssetSummary({ last_on_chain_at: undefined })]} />);
    const tile = screen.getByTestId("asset-tile-weth");
    // No prior on-chain timestamp → "never".
    expect(tile).toHaveTextContent("never");

    act(() => {
      captured.onEvent?.({
        kind: "PRICE_FULFILLED",
        price_fulfilled: {
          req_id: "1",
          asset_id: "weth",
          price: "500000000000",
          timestamp: "0",
          round_id: "7",
        },
        meta: { tx_hash: "0xabc" },
      });
    });

    // Patched to "now" → renders a fresh relative age, not "never".
    expect(screen.getByTestId("asset-tile-weth")).not.toHaveTextContent("never");
  });
});
