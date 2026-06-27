"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Route error boundary — shown when the BFF is unreachable for this asset. */
export default function AssetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[asset-detail]", error);
  }, [error]);

  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 11, letterSpacing: "3px", color: "var(--fg-dim)", marginBottom: 12 }}>
        {"ERROR // FEED UNAVAILABLE"}
      </div>
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: "clamp(24px,5vw,40px)",
          fontWeight: 800,
          letterSpacing: "2px",
          color: "var(--ac)",
          textShadow: "0 0 14px var(--acg)",
        }}
      >
        COULD NOT LOAD FEED
      </h1>
      <p style={{ color: "var(--fg-muted)", fontSize: 13, marginBottom: 24 }}>
        The price API is unreachable right now. Try again in a moment.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => reset()}
          className="lh-btn-outline"
          style={{ fontSize: 12, letterSpacing: "1px", padding: "10px 18px" }}
        >
          RETRY
        </button>
        <Link
          href="/"
          className="lh-linkbtn"
          style={{ fontSize: 12, letterSpacing: "1px", padding: "10px 18px" }}
        >
          ← BACK TO DASHBOARD
        </Link>
      </div>
    </div>
  );
}
