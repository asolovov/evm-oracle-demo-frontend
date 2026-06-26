"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "lh-demo-banner-dismissed";

/**
 * Persistent, dismissible demo disclaimer (spec NFR-08). Dismissal is remembered
 * in localStorage. Renders nothing until the client has read that flag, to avoid
 * a hydration flash.
 */
export function DemoBanner() {
  const [state, setState] = useState<"loading" | "shown" | "hidden">("loading");

  useEffect(() => {
    // localStorage is browser-only; read it after mount to avoid a hydration flash.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(localStorage.getItem(DISMISS_KEY) === "1" ? "hidden" : "shown");
  }, []);

  if (state !== "shown") return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setState("hidden");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "9px clamp(14px,4vw,40px)",
        background: "repeating-linear-gradient(45deg,var(--acf) 0 12px,rgba(0,0,0,0) 12px 24px)",
        borderBottom: "1px solid var(--acd)",
        fontSize: 11.5,
        letterSpacing: "1.2px",
        color: "var(--ac)",
        textShadow: "0 0 6px var(--acg)",
      }}
    >
      <span style={{ flexShrink: 0, fontWeight: 700 }}>⚠ DEMO</span>
      <span style={{ color: "var(--fg-muted)", letterSpacing: "1px", flex: 1, minWidth: 0 }}>
        RUNNING ON TESTNETS · REPORTER KEYS ARE ON-DISK · DO NOT USE IN PRODUCTION
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="lh-ctl"
        style={{ flexShrink: 0, fontSize: 11, padding: "3px 9px", color: "var(--ac)" }}
      >
        DISMISS ✕
      </button>
    </div>
  );
}
