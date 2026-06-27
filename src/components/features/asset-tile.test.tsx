import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssetTile, type AssetTileData } from "@/components/features/asset-tile";

const DATA: AssetTileData = {
  id: "weth",
  symbol: "WETH",
  name: "Wrapped Ether",
  priceStr: "$3,412.88",
  sourceAges: [2, 5, 11],
  sourceCount: 3,
  onChainAgeStr: "9s ago",
  offChainAgeStr: "2s ago",
  spreadStr: "0.04% spread",
  sourcePoints: [0, 0.5, 1],
};

describe("AssetTile", () => {
  it("renders the symbol, name, price and source count", () => {
    render(<AssetTile data={DATA} animate={false} />);
    expect(screen.getByText("WETH")).toBeInTheDocument();
    expect(screen.getByText("Wrapped Ether")).toBeInTheDocument();
    expect(screen.getByText("$3,412.88")).toBeInTheDocument();
    expect(screen.getByText("◇ 3 SRC")).toBeInTheDocument();
  });

  it("links to the drill-down route", () => {
    render(<AssetTile data={DATA} animate={false} />);
    const link = screen.getByTestId("asset-tile-weth");
    expect(link).toHaveAttribute("href", "/assets/weth");
  });

  it("shows the real source-agreement spread (no synthetic sparkline)", () => {
    render(<AssetTile data={DATA} animate={false} />);
    expect(screen.getByText("SOURCE AGREEMENT")).toBeInTheDocument();
    expect(screen.getByText("0.04% spread")).toBeInTheDocument();
  });
});
