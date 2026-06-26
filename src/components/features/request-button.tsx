"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buildRequestTxAction } from "@/app/assets/[id]/_actions/build-request-tx";
import { useWallet } from "@/components/wallet/wallet-provider";
import { CHAIN, explorerTx } from "@/config/chain";
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
   * Whether the BFF has resolved this asset's aggregator address. When false,
   * `build-tx` will 503 (`aggregator_not_resolved`) — surface that up front
   * instead of letting the user click into a guaranteed failure.
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
      // 3. Build calldata via the BFF.
      setPhase("building");
      const result = await buildRequestTxAction({ assetId });
      const tx = result?.data;
      if (!tx) {
        setPhase("error");
        setMessage(result?.serverError ?? "Could not build the transaction.");
        return;
      }

      // Defensive: never sign a tx the BFF built for a different chain.
      if (tx.chain_id !== CHAIN.id) {
        setPhase("error");
        setMessage(`Chain mismatch: the API targeted chain ${tx.chain_id}, expected ${CHAIN.id}.`);
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
        title={aggregatorKnown ? undefined : "Aggregator not indexed yet"}
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
          ⚠ Aggregator not indexed yet — on-chain requests are unavailable until the indexer catches
          up.
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
