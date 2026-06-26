import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RequestButton } from "@/components/features/request-button";
import { WalletProvider } from "@/components/wallet/wallet-provider";

// RequestButton calls useRouter at render; provide a stub outside Next runtime.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Avoid invoking the real server action / RPC in this unit test.
vi.mock("@/app/assets/[id]/_actions/build-request-tx", () => ({
  buildRequestTxAction: vi.fn(),
}));
vi.mock("@/lib/wallet/request-receipt", () => ({ waitForRequestId: vi.fn() }));

function renderButton() {
  return render(
    <WalletProvider>
      <RequestButton assetId="weth" />
    </WalletProvider>,
  );
}

describe("RequestButton", () => {
  it("shows the request CTA initially", () => {
    renderButton();
    expect(screen.getByRole("button", { name: /REQUEST UPDATE/i })).toBeInTheDocument();
  });

  it("prompts to connect a wallet when none is available", async () => {
    // jsdom has no window.ethereum, so connect() fails and the flow stops early.
    renderButton();
    await userEvent.click(screen.getByRole("button", { name: /REQUEST UPDATE/i }));
    await waitFor(() =>
      expect(screen.getByText(/Connect a wallet|No EVM wallet/i)).toBeInTheDocument(),
    );
  });
});
