import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceComposition } from "@/components/features/source-composition";
import type { SourceContribution } from "@/lib/api/schemas";

const sources: SourceContribution[] = [
  {
    source: "coingecko",
    price: 100,
    fetched_at: "2026-06-27T00:00:00Z",
    age_sec: 2,
    included: true,
  },
  {
    source: "uniswap_v3",
    price: 102,
    fetched_at: "2026-06-27T00:00:00Z",
    age_sec: 5,
    included: false,
  },
];

describe("SourceComposition", () => {
  it("renders each source with deviation-from-median and inclusion", () => {
    render(<SourceComposition sources={sources} median={100} />);
    expect(screen.getByText("COINGECKO")).toBeInTheDocument();
    expect(screen.getByText("UNISWAP V3")).toBeInTheDocument();
    expect(screen.getByText("✓ IN")).toBeInTheDocument();
    expect(screen.getByText("✕ OUT")).toBeInTheDocument();
    expect(screen.getByText("+2.00%")).toBeInTheDocument(); // 102 vs median 100
  });

  it("shows an empty state with no sources", () => {
    render(<SourceComposition sources={[]} median={0} />);
    expect(screen.getByText(/No sources reported/i)).toBeInTheDocument();
  });
});
