import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "@/components/features/dashboard";
import { ASSET_CATALOG } from "@/test/fixtures";

describe("Dashboard", () => {
  it("renders a tile per asset and the summary stats", () => {
    render(<Dashboard initialAssets={ASSET_CATALOG} />);
    expect(screen.getByTestId("asset-tile-weth")).toBeInTheDocument();
    expect(screen.getByTestId("asset-tile-hg")).toBeInTheDocument();
    expect(screen.getByText("ASSETS TRACKED")).toBeInTheDocument();
    // 10 assets, all priced.
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("10 / 10")).toBeInTheDocument();
  });

  it("shows an empty state when there are no feeds", () => {
    render(<Dashboard initialAssets={[]} />);
    expect(screen.getByText(/No feeds available/i)).toBeInTheDocument();
  });
});
