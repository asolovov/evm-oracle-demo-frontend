import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type BootInfo, LiveTerminal } from "@/components/features/live-terminal";
import type { AggregatedPrice } from "@/lib/api/schemas";
import type { TerminalLine } from "@/lib/terminal-line";

const captured = vi.hoisted(() => ({
  onPrice: undefined as ((p: AggregatedPrice) => void) | undefined,
}));

vi.mock("@/hooks/use-live-stream", () => ({
  useLiveStream: (h: { onPrice?: (p: AggregatedPrice) => void }) => {
    captured.onPrice = h.onPrice;
    return "open";
  },
}));

const BOOT: BootInfo = { reporters: 3, threshold: 2, block: "6284193", assetCount: 10 };
const SEED: TerminalLine[] = [
  {
    id: "s1",
    ts: "00:00:01",
    tag: "SUBMIT",
    text: "WETH $3,450.20 confirmed req#42",
    reqId: "42",
    tone: "submit",
  },
];

describe("LiveTerminal", () => {
  it("renders the seeded activity and links request lines", () => {
    render(<LiveTerminal boot={BOOT} seed={SEED} />);
    const link = screen.getByRole("link", { name: /req#42/ });
    expect(link).toHaveAttribute("href", "/requests/42");
  });

  it("appends a live price frame to the feed", () => {
    render(<LiveTerminal boot={BOOT} seed={[]} />);
    act(() => {
      captured.onPrice?.({
        asset_id: "weth",
        median_price: 3412.88,
        aggregated_at: "2026-06-27T00:00:00Z",
        sources: [{ source: "coingecko", price: 1, fetched_at: "", age_sec: 1, included: true }],
      });
    });
    expect(screen.getByText(/WETH \$3,412\.88 · median of 1 src/)).toBeInTheDocument();
  });
});
