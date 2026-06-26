import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  // cacheComponents (PPR) intentionally OFF.
  // See docs/cache-components.md before enabling.
  cacheComponents: false,
};

export default nextConfig;
