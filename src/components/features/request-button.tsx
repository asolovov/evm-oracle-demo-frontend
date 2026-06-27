"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/components/wallet/wallet-provider";
import { CHAIN, explorerTx } from "@/config/chain";
import { buildRequestTx } from "@/lib/wallet/build-request-tx";
import { estimateRequestGas } from "@/lib/wallet/estimate";
import { waitForRequestId } from "@/lib/wallet/request-receipt";

type Phase = "idle" | "building" | "signing" | "mining" | "error" | "done";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "⚡ REQUEST UPDATE",
  building: "BUILDING TX…",
  signing: "CONFIRM IN WALLET…",
  mining: "MINING…",
  error: "⚡ RETRY REQUEST",
  done: "✓ REQUESTED",
};

/**
 * Wallet-signed `requestPrice` flow: connect → ensure target chain → build
 * calldata (via BFF) → sign+broadcast → read reqId from the receipt → route to
 * the request status page.
 */
export function RequestButton({
  assetId,
  aggregatorKnown = true,
}: {
  assetId: string;
  /**
   * Whether an aggregator address is configured for this asset (it always is for
   * the deployed set). When false, the request can't be built — surface that up
   * front instead of letting the user click into a failure.
   */
  aggregatorKnown?: boolean;
}) {
  const wallet = useWallet();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const busy = phase === "building" || phase === "signing" || phase === "mining";

  async function run() {
    setMessage(null);
    setTxHash(null);

    // 1. Wallet present + connected. Track address + chain from fresh results
    // (state from this render is stale across the awaits below).
    let address = wallet.address;
    let onTargetChain = wallet.onTargetChain;
    if (!address) {
      const result = await wallet.connect();
      address = result.address;
      onTargetChain = result.address !== null && result.chainId === CHAIN.id;
      if (!address) {
        setPhase("error");
        setMessage(wallet.error ?? "Connect a wallet to request an update.");
        return;
      }
    }

    // 2. Correct chain.
    if (!onTargetChain) {
      const ok = await wallet.switchToTargetChain();
      if (!ok) {
        setPhase("error");
        setMessage(`Switch your wallet to ${CHAIN.name} and try again.`);
        return;
      }
    }

    try {
      // 3. Build calldata client-side: encode requestPrice() against the asset's
      // aggregator and read its requestFee for msg.value.
      setPhase("building");
      let tx: { to: string; data: string; value: string };
      try {
        tx = await buildRequestTx(assetId);
      } catch (err) {
        setPhase("error");
        setMessage(err instanceof Error ? err.message : "Could not prepare the request.");
        return;
      }

      // 3b. Pre-flight: a tx that would revert fails estimation. Catch it here so
      // the user gets a clear message instead of the wallet broadcasting a doomed
      // tx and surfacing a cryptic "gas limit too high" / internal RPC error.
      try {
        await estimateRequestGas({ to: tx.to, data: tx.data, value: tx.value, account: address });
      } catch {
        setPhase("error");
        setMessage(
          "This request would fail on-chain and was not sent. The feed may be misconfigured — try again later.",
        );
        return;
      }

      // 4. Sign + broadcast.
      setPhase("signing");
      const hash = await wallet.sendTransaction({ to: tx.to, data: tx.data, value: tx.value });
      setTxHash(hash);

      // 5. Wait for the receipt and pull out reqId.
      setPhase("mining");
      const reqId = await waitForRequestId(hash, { aggregator: tx.to, requester: address });
      if (reqId) {
        setPhase("done");
        router.push(`/requests/${reqId}`);
        return;
      }

      // Mined, but no PriceRequested log found — surface the tx anyway.
      setPhase("done");
      setMessage("Transaction mined, but no request id was found in the receipt.");
    } catch (err) {
      setPhase("error");
      const msg = err instanceof Error ? err.message : "Transaction failed.";
      // Trim noisy wallet rejection stacks to the first line.
      setMessage(msg.split("\n")[0] ?? msg);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy || !aggregatorKnown}
        className="lh-btn"
        style={{ fontSize: 13, padding: "13px 22px" }}
        title={aggregatorKnown ? undefined : "No aggregator configured for this asset"}
      >
        {PHASE_LABEL[phase]}
      </button>
      {!aggregatorKnown ? (
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.5px",
            color: "var(--fg-muted)",
            maxWidth: 320,
            textAlign: "right",
          }}
        >
          ⚠ On-chain requests are not available for this asset.
        </span>
      ) : null}
      {message ? (
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.5px",
            color: phase === "error" ? "var(--bad)" : "var(--fg-muted)",
            maxWidth: 320,
            textAlign: "right",
          }}
        >
          {message}
        </span>
      ) : null}
      {txHash ? (
        <a
          href={explorerTx(txHash)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--link)", textDecoration: "none" }}
        >
          view tx ↗
        </a>
      ) : null}
    </div>
  );
}
