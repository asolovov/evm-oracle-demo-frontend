# frontend-next-template

Next.js 16 starter optimized for AI-agent coding workflows (Claude Code, Cursor, v0). Frontend-only — designed to consume a Go backend API.

**Agents: start with [`AGENTS.md`](./AGENTS.md).** It's the source of truth for conventions, structure, and self-verification.

## Stack

- Next.js 16.2 (App Router, Turbopack, React Compiler)
- React 19.2, TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- Tailwind CSS v4 · shadcn/ui · Lucide icons
- Conform + Zod v4 (forms) · next-safe-action
- Biome (+ thin ESLint for `react-hooks` / `next` / `react-compiler`)
- Vitest · React Testing Library · MSW · Playwright
- pnpm 10 · Lefthook · t3-env
- `AGENTS.md` + `CLAUDE.md` (single source of truth, `@import` pattern)

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Visit <http://localhost:3000>.

## Useful scripts

```bash
pnpm verify       # typecheck + lint + tests + build (run before any PR)
pnpm test         # vitest watch
pnpm test:e2e     # playwright
pnpm lint:fix     # biome + eslint autofix
```

## What's intentionally NOT here

- No DB / ORM. Backend is Go.
- No NextAuth. Auth lives in Go; `src/lib/api/client.ts` forwards cookies and `Authorization`.
- No Zustand or TanStack Query pre-installed. Add only when actually needed (see AGENTS.md).
- No Storybook. Add per-project if building a design system (10.1+ for MCP).
- `cacheComponents` (PPR) is OFF. See `docs/cache-components.md` before enabling.

## License

MIT
