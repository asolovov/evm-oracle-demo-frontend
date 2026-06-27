"use client";

import { useState } from "react";

/** Copies `value` to the clipboard, flashing a confirmation. */
export function CopyButton({ value, label = "COPY" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — ignore silently.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="lh-ctl"
      style={{ fontSize: 10.5, padding: "6px 12px", color: "var(--ac)" }}
    >
      {copied ? "COPIED ✓" : label}
    </button>
  );
}
