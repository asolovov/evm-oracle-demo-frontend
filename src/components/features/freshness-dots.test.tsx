import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FreshnessDots } from "@/components/features/freshness-dots";

describe("FreshnessDots", () => {
  it("renders one dot per source with a freshness title", () => {
    render(<FreshnessDots ages={[2, 600, 7200]} animate={false} />);
    expect(screen.getByTitle("source 1: fresh")).toBeInTheDocument();
    expect(screen.getByTitle("source 2: stale")).toBeInTheDocument();
    expect(screen.getByTitle("source 3: old")).toBeInTheDocument();
  });

  it("shows a placeholder when there are no sources", () => {
    render(<FreshnessDots ages={[]} />);
    expect(screen.getByText("NO SRC")).toBeInTheDocument();
  });
});
