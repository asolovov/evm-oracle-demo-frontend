import type { Metadata } from "next";
import { AUTHOR } from "@/config/author";

export const metadata: Metadata = {
  title: "About — Andrei Solovov · Lighthouse Oracle",
  description: AUTHOR.bio,
};

export default function AboutPage() {
  const contacts: { label: string; href: string }[] = [
    { label: "LINKEDIN ↗", href: AUTHOR.links.linkedin },
    { label: "GITHUB ↗", href: AUTHOR.links.github },
    { label: "SOURCE ↗", href: AUTHOR.links.source },
    { label: "EMAIL ↗", href: AUTHOR.links.email },
  ];
  if (AUTHOR.links.upwork) contacts.push({ label: "UPWORK ↗", href: AUTHOR.links.upwork });

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 34,
          flexWrap: "wrap",
          alignItems: "flex-start",
          marginBottom: 42,
        }}
      >
        {/* Headshot placeholder — real asset stays out of the repo until provided. */}
        <div
          style={{
            flexShrink: 0,
            width: 200,
            height: 240,
            border: "1px solid var(--ac)",
            background:
              "repeating-linear-gradient(45deg,var(--acf) 0 10px,rgba(0,0,0,0) 10px 20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 0 28px -10px var(--acg)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 7,
              left: 7,
              width: 14,
              height: 14,
              borderTop: "1px solid var(--ac)",
              borderLeft: "1px solid var(--ac)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 7,
              right: 7,
              width: 14,
              height: 14,
              borderBottom: "1px solid var(--ac)",
              borderRight: "1px solid var(--ac)",
            }}
          />
          <div style={{ fontSize: 34, color: "var(--ac)", textShadow: "0 0 10px var(--acg)" }}>
            ◉
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "2px",
              color: "var(--fg-dim)",
              textAlign: "center",
            }}
          >
            [ HEADSHOT
            <br />
            PENDING ]
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <div
            style={{ fontSize: 11, letterSpacing: "3px", color: "var(--fg-dim)", marginBottom: 10 }}
          >
            {"// AUTHOR"}
          </div>
          <h1
            style={{
              margin: "0 0 16px",
              fontSize: "clamp(28px,5vw,44px)",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "var(--ac)",
              textShadow: "0 0 14px var(--acg)",
            }}
          >
            {AUTHOR.name.toUpperCase()}
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#c9b489",
              maxWidth: 560,
              margin: "0 0 22px",
            }}
          >
            {AUTHOR.bio}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="lh-linkbtn"
                style={{ fontSize: 12, letterSpacing: "1px", padding: "9px 16px" }}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 13, letterSpacing: "2px", color: "var(--fg-dim)", marginBottom: 14 }}>
        root@lighthouse:~$ cat ./credentials
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
          marginBottom: 38,
        }}
      >
        {AUTHOR.credentials.map((c) => (
          <a
            key={c.company}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="lh-card"
            style={{ padding: 18, textDecoration: "none", display: "block" }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--fg)",
                letterSpacing: "0.5px",
                marginBottom: 5,
              }}
            >
              {c.company} ↗
            </div>
            <div style={{ fontSize: 13, color: "var(--ac)", marginBottom: 8 }}>{c.role}</div>
            <div style={{ fontSize: 11, letterSpacing: "1px", color: "var(--fg-dim)" }}>
              {c.period}
            </div>
          </a>
        ))}
      </div>

      <div style={{ fontSize: 13, letterSpacing: "2px", color: "var(--fg-dim)", marginBottom: 14 }}>
        root@lighthouse:~$ cat ./projects
      </div>
      <div style={{ border: "1px solid var(--acd)" }}>
        {AUTHOR.projects.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="lh-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              padding: "15px 18px",
              borderBottom: "1px solid rgba(255,176,0,0.08)",
              textDecoration: "none",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--fg)", letterSpacing: "0.5px" }}>
              ▸ {p.name}
            </span>
            <span
              style={{
                fontSize: 11.5,
                color: "var(--fg-dim)",
                flex: 1,
                textAlign: "right",
                minWidth: 160,
              }}
            >
              {p.desc}
            </span>
            <span style={{ color: "var(--ac)", fontSize: 12 }}>↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
