/** Fixed scanline + flicker overlays. Decorative only; never block pointer events. */
export function CrtOverlays() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg,rgba(0,0,0,0) 0 2px,rgba(0,0,0,0.16) 2px 3px)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 61,
          pointerEvents: "none",
          background: "var(--ac)",
          mixBlendMode: "overlay",
          // Base opacity so the overlay stays subtle when the animation is
          // disabled under prefers-reduced-motion (otherwise it'd be fully opaque).
          opacity: 0.06,
          animation: "flick 0.13s infinite",
        }}
      />
    </>
  );
}
