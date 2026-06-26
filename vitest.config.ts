import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e"],
    env: {
      NEXT_PUBLIC_API_URL: "http://api.test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` throws at import in non-react-server envs.
      // Alias to the package's own empty.js for tests.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
});
