"use client";

import { useWallet } from "@/components/wallet/wallet-provider";
import { CHAIN } from "@/config/chain";
import { shorten } from "@/lib/format";

/** Header wallet control. Connects, prompts a network switch, or shows the account. */
export function WalletButton() {
  const wallet = useWallet();

  if (wallet.address && !wallet.onTargetChain) {
    return (
      <button
        type="button"
        onClick={() => void wallet.switchToTargetChain()}
        className="lh-btn-outline"
        style={{ fontSize: 12, fontWeight: 700, padding: "8px 15px" }}
      >
        ⚠ SWITCH TO {CHAIN.name.toUpperCase()}
      </button>
    );
  }

  if (wallet.address) {
    return (
      <button
        type="button"
        onClick={() => void 0}
        className="lh-btn-outline"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 700,
          padding: "8px 15px",
          cursor: "default",
        }}
        title={wallet.address}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--good)",
            boxShadow: "0 0 6px var(--good)",
          }}
        />
        {shorten(wallet.address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void wallet.connect()}
      disabled={wallet.connecting}
      className="lh-btn-outline"
      style={{ fontSize: 12, fontWeight: 700, padding: "8px 15px" }}
      title={wallet.error ?? undefined}
    >
      {wallet.connecting ? "CONNECTING…" : "CONNECT WALLET"}
    </button>
  );
}
