"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet/wallet-button";
import { CHAIN } from "@/config/chain";

/** Lighthouse mark — a small beacon glyph. */
function LighthouseMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ac)"
      strokeWidth="1.4"
      style={{ filter: "drop-shadow(0 0 5px var(--acg))", flexShrink: 0 }}
      role="img"
      aria-label="Lighthouse Oracle"
    >
      <title>Lighthouse Oracle</title>
      <path d="M9.4 21 L10.4 9.5 L13.6 9.5 L14.6 21 Z" />
      <rect x="9.6" y="6" width="4.8" height="3.5" />
      <path d="M12 6 V2.5" />
      <path d="M9.6 7.6 L4.5 5.4" />
      <path d="M14.4 7.6 L19.5 5.4" />
      <path d="M8.6 21 H15.4" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const isAbout = pathname === "/about";
  const isDashboard = !isAbout;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        padding: "16px clamp(14px,4vw,40px)",
        borderBottom: "1px solid var(--acd)",
        background: "rgba(10,8,6,0.7)",
        backdropFilter: "blur(2px)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          marginRight: "auto",
          textDecoration: "none",
        }}
      >
        <LighthouseMark />
        <div style={{ lineHeight: 1.05 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              letterSpacing: "4px",
              color: "var(--ac)",
              textShadow: "0 0 10px var(--acg)",
            }}
          >
            LIGHTHOUSE
          </div>
          <div style={{ fontSize: 9.5, letterSpacing: "3.5px", color: "var(--fg-dim)" }}>
            {"// MULTI-SOURCE ORACLE"}
          </div>
        </div>
      </Link>

      <nav style={{ display: "flex", gap: 6, fontSize: 12, letterSpacing: "2px" }}>
        <Link href="/" className="lh-nav" data-active={isDashboard} style={{ padding: "7px 13px" }}>
          {isDashboard ? <span style={{ color: "var(--ac)" }}>▸ </span> : null}DASHBOARD
        </Link>
        <Link
          href="/about"
          className="lh-nav"
          data-active={isAbout}
          style={{ padding: "7px 13px" }}
        >
          {isAbout ? <span style={{ color: "var(--ac)" }}>▸ </span> : null}ABOUT
        </Link>
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "7px 12px",
          border: "1px solid var(--acd)",
          fontSize: 11,
          letterSpacing: "1.5px",
          color: "var(--ac)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--good)",
            boxShadow: "0 0 7px var(--good)",
            animation: "pulseDot 2s infinite",
          }}
        />
        {CHAIN.name.toUpperCase()}
      </div>

      <WalletButton />
    </header>
  );
}
