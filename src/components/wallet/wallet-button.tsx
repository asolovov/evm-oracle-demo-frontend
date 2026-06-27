"use client";

import { useWallet } from "@/components/wallet/wallet-provider";
import { CHAIN } from "@/config/chain";
import { shorten } from "@/lib/format";

/** Header wallet control. Connects, prompts a network switch, shows the account, and disconnects. */
export function WalletButton() {
  const wallet = useWallet();

  if (wallet.address) {
    // Connected (right chain → status pill; wrong chain → switch CTA), always
    // paired with a disconnect control.
    const control = wallet.onTargetChain ? (
      <span
        role="status"
        aria-label={`Wallet connected: ${wallet.address}`}
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
      </span>
    ) : (
      <button
        type="button"
        onClick={() => void wallet.switchToTargetChain()}
        className="lh-btn-outline"
        style={{ fontSize: 12, fontWeight: 700, padding: "8px 15px" }}
      >
        ⚠ SWITCH TO {CHAIN.name.toUpperCase()}
      </button>
    );

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {control}
        <button
          type="button"
          onClick={() => wallet.disconnect()}
          className="lh-ctl"
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
          style={{ fontSize: 12, padding: "8px 11px", color: "var(--ac)" }}
        >
          ✕
        </button>
      </div>
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
