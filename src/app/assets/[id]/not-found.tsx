import Link from "next/link";

export default function AssetNotFound() {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 11, letterSpacing: "3px", color: "var(--fg-dim)", marginBottom: 12 }}>
        {"ERROR // 404"}
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
        FEED NOT FOUND
      </h1>
      <p style={{ color: "var(--fg-muted)", fontSize: 13, marginBottom: 24 }}>
        That asset is not tracked, or no aggregated price has been observed yet.
      </p>
      <Link
        href="/"
        className="lh-linkbtn"
        style={{ fontSize: 12, letterSpacing: "1px", padding: "10px 18px" }}
      >
        ← BACK TO DASHBOARD
      </Link>
    </div>
  );
}
