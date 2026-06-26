import { ImageResponse } from "next/og";

export const alt = "Lighthouse Oracle — Multi-source price oracle by Andrei Solovov";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded 1200×630 social card (FR / spec §5.3, §5.5). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#0a0806",
        backgroundImage:
          "linear-gradient(rgba(255,176,0,0.10) 1px,transparent 1px),linear-gradient(90deg,rgba(255,176,0,0.10) 1px,transparent 1px)",
        backgroundSize: "44px 44px",
        fontFamily: "monospace",
      }}
    >
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 8, color: "#7d6a47" }}>
        root@lighthouse:~$ ./start --watch
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 130,
          fontWeight: 800,
          letterSpacing: 4,
          color: "#ffb000",
          lineHeight: 1,
          marginTop: 24,
        }}
      >
        LIGHTHOUSE
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 130,
          fontWeight: 800,
          letterSpacing: 4,
          color: "#e8dcc4",
          lineHeight: 1,
        }}
      >
        ORACLE
      </div>
      <div style={{ display: "flex", fontSize: 30, color: "#b89c66", marginTop: 40 }}>
        Multi-source price oracle · by Andrei Solovov
      </div>
    </div>,
    size,
  );
}
