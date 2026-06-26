"use client";

import { useEffect, useState } from "react";

const BOOT_LINES = [
  "> lighthouse oracle node v1.0.0 — cold boot",
  "> connect ethereum sepolia ............ [ OK ]",
  "> load oracle registry ................ [ OK ]",
  "> spawn source reporters .............. [ OK ]",
  "> index tracked assets ................ [ OK ]",
  "> subscribe ws://node/ws/stream ...... [ LIVE ]",
  "> ready. watching the markets.",
];

/** Typed boot log. Honors prefers-reduced-motion by rendering the full text. */
export function BootTerminal() {
  const full = BOOT_LINES.join("\n");
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // Browser-only preference read; can't run during SSR/render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTyped(full);
      return;
    }
    let i = 0;
    const iv = setInterval(() => {
      i += 2;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [full]);

  return (
    <div
      style={{
        border: "1px solid var(--acd)",
        background: "rgba(0,0,0,0.45)",
        boxShadow: "inset 0 0 40px -20px var(--acg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 12px",
          borderBottom: "1px solid var(--acd)",
          fontSize: 10,
          letterSpacing: "1.5px",
          color: "var(--fg-dim)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--ac)",
            boxShadow: "0 0 6px var(--acg)",
          }}
        />
        node.log — live
      </div>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          fontFamily: "inherit",
          fontSize: 12.5,
          lineHeight: 1.7,
          color: "#9ad6a0",
          whiteSpace: "pre-wrap",
          minHeight: 150,
        }}
      >
        {typed}
        <span
          style={{
            display: "inline-block",
            width: "0.55em",
            height: "1.05em",
            background: "var(--ac)",
            boxShadow: "0 0 8px var(--acg)",
            verticalAlign: "text-bottom",
            animation: "blink 1s step-end infinite",
          }}
        />
      </pre>
    </div>
  );
}
