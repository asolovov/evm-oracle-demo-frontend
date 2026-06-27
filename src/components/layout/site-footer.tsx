import Link from "next/link";
import { AUTHOR, footerLinks } from "@/config/author";
import { CHAIN } from "@/config/chain";

/** Persistent credential footer (FR-09). Upwork link appears only when configured. */
export function SiteFooter() {
  const links = footerLinks();
  return (
    <footer
      style={{
        borderTop: "1px solid var(--acd)",
        padding: "22px clamp(14px,4vw,40px)",
        background: "rgba(10,8,6,0.6)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            fontSize: 12,
            letterSpacing: "0.5px",
            color: "var(--fg-dim)",
          }}
        >
          <span style={{ color: "var(--ac)" }}>▲</span>
          <span>
            Built by <span style={{ color: "var(--fg)" }}>{AUTHOR.name}</span>
          </span>
          {links.map((l) => (
            <span key={l.label} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: "var(--fg-faint)" }}>·</span>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ac)", textDecoration: "none" }}
              >
                {l.label}
              </a>
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontSize: 10.5,
            letterSpacing: "1px",
            color: "var(--fg-faint)",
          }}
        >
          <Link href="/how-it-works" style={{ color: "var(--ac)", textDecoration: "none" }}>
            HOW IT WORKS
          </Link>
          <span>lighthouse-oracle · {CHAIN.name.toLowerCase()}</span>
        </div>
      </div>
    </footer>
  );
}
