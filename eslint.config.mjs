// Thin ESLint layer: only the rules Biome does not cover —
// react-hooks (incl. exhaustive-deps), @next/eslint-plugin-next, react-compiler.
// Biome handles formatting and the bulk of lint rules. See biome.json.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import reactCompiler from "eslint-plugin-react-compiler";

const config = [
  ...nextCoreWebVitals,
  reactCompiler.configs.recommended,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "src/components/ui/**",
    ],
  },
];

export default config;
