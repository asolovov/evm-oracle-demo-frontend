import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnChainRounds } from "@/components/features/on-chain-rounds";
import { OnChainRoundsChain } from "@/components/features/on-chain-rounds-chain";
import type { SubmissionStatus } from "@/lib/api/schemas";
import type { OnChainRound } from "@/lib/chain/reads";

const NOW = Date.parse("2026-06-27T00:00:10.000Z");

describe("OnChainRounds (submissions)", () => {
  const subs: SubmissionStatus[] = [
    {
      req_id: "42",
      asset_id: "weth",
      tx_hash: "0xabc0000000000000000000000000000000000000000000000000000000000001",
      submitted_price: "345020000000",
      submitted_at: "2026-06-27T00:00:00.000Z",
      status: "confirmed",
      retry_count: 0,
    },
    {
      req_id: "0",
      asset_id: "weth",
      tx_hash: "0xdef0000000000000000000000000000000000000000000000000000000000002",
      submitted_price: "345020000000",
      submitted_at: "2026-06-27T00:00:00.000Z",
      status: "confirmed",
      retry_count: 0,
    },
  ];

  it("links a consumer request to its status page", () => {
    render(<OnChainRounds submissions={subs} now={NOW} />);
    expect(screen.getByRole("link", { name: /#42/ })).toHaveAttribute("href", "/requests/42");
  });

  it("does not link a heartbeat submission (req_id 0)", () => {
    render(<OnChainRounds submissions={subs} now={NOW} />);
    expect(screen.getByText("HB")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /#0/ })).toBeNull();
  });
});

describe("OnChainRoundsChain", () => {
  const rounds: OnChainRound[] = [
    { roundId: 4n, answer: 409060009800n, updatedAt: BigInt(Math.floor(NOW / 1000) - 5) },
    { roundId: 3n, answer: 407630004900n, updatedAt: BigInt(Math.floor(NOW / 1000) - 100) },
  ];

  it("renders real rounds with formatted answers", () => {
    render(<OnChainRoundsChain rounds={rounds} decimals={8} now={NOW} />);
    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("$4,090.60")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<OnChainRoundsChain rounds={[]} decimals={8} now={NOW} />);
    expect(screen.getByText(/No on-chain rounds yet/i)).toBeInTheDocument();
  });
});
