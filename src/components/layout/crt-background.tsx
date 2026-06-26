/** Fixed CRT backdrop: an animated accent grid masked to the top, plus a vignette. */
export function CrtBackground() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(var(--acd) 1px,transparent 1px),linear-gradient(90deg,var(--acd) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
          opacity: 0.32,
          animation: "gridmove 7s linear infinite",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 30%,#000 30%,transparent 78%)",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%,#000 30%,transparent 78%)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 75% 65% at 50% 38%,transparent 40%,rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}
