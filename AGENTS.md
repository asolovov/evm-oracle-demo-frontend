<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: frontend-next-template

A Next.js 16 starter optimized for AI-agent coding workflows. **Frontend-only.** The backend is a separate Go service this app talks to via `src/lib/api/`.

## Tech stack (pinned)

- **Next.js 16.2** App Router only — no `pages/`. React 19.2, TypeScript 5.
- **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`).
- **Cache Components / PPR** intentionally OFF (`cacheComponents: false`). See `docs/cache-components.md` before enabling.
- **Tailwind v4**, **shadcn/ui**, **Lucide** icons.
- **Conform + Zod v4** for forms; **next-safe-action** for typed server actions.
- **Biome** (format + most lint) + thin **ESLint** (`react-hooks`, `@next/eslint-plugin-next`, `react-compiler`).
- **Vitest + RTL + MSW** for unit/component; **Playwright** for e2e.
- **pnpm 10**, **Lefthook**, **t3-env**.

**Not pre-installed — add per project only when actually needed:**
- TanStack Query — only for polling, optimistic updates, infinite scroll, shared client cache.
- Zustand — only when client state outgrows `useState` / `useReducer`.
- Storybook — only when building a design system (10.1+ for MCP).
- DB/ORM — **do not add**. Backend is Go.
- NextAuth / Better-Auth — **do not add**. Auth is in Go; this app forwards cookies + `Authorization` headers.

## Setup

```bash
pnpm install
cp .env.example .env.local   # edit NEXT_PUBLIC_API_URL
pnpm dev
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | dev server (Turbopack) |
| `pnpm build` | production build |
| `pnpm start` | run the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome check + ESLint |
| `pnpm lint:fix` | autofix both |
| `pnpm format` | Biome format |
| `pnpm test` | Vitest (watch) |
| `pnpm test:run` | Vitest one-shot |
| `pnpm test:e2e` | Playwright |
| `pnpm verify` | typecheck + lint + tests + build |

## Self-verification — run before declaring work done

```bash
pnpm verify
```

Chains `tsc --noEmit && biome check && eslint . && vitest run && next build`. Do not consider a task complete until this passes locally.

## Where things live

| You want to… | Go to |
|---|---|
| Add a page | `src/app/(group)/<route>/page.tsx` |
| Route-private component | `src/app/<route>/_components/` |
| Cross-route component | `src/components/features/` (create on second use) |
| Add a shadcn primitive | `pnpm dlx shadcn@latest add <name>` — never hand-edit `src/components/ui/*` |
| Add a server action | `src/app/<route>/_actions/<verb-noun>.ts`, wrap with `action` from `@/lib/safe-action` |
| Add a Zod schema | Route-scoped: `_schemas/`. Shared: `src/lib/validators/` |
| Add an env var | `src/env.ts` (typed via t3-env) + `.env.example` |
| Call the Go backend | `src/lib/api/client.ts` — `api.get`/`api.post`/etc. with a Zod response schema |
| Unit / component test | Co-locate `foo.test.ts(x)` next to the source |
| E2E test | `tests/e2e/*.spec.ts` |
| MSW handler | `src/test/msw/handlers.ts` |

## Conventions

### Folder & file
- Single path alias: `@/*` → `./src/*`. **Do not invent** `@ui/*`, `@lib/*`, etc.
- App Router only. **Do not create `pages/`.**
- Route groups: `(marketing)`, `(app)` — organize layouts without affecting URLs.
- Underscore-prefix private folders: `_components/`, `_actions/`, `_schemas/`, `_lib/`. Opted out of routing.
- File naming: `kebab-case.tsx`. Components: `PascalCase`. Hooks: `useThing`. Actions: `verbNoun.ts`.
- `"use client"` / `"use server"` directives go on line 1.

### No barrel files
- **Do not write `index.ts` re-export files.** Biome's `noBarrelFile` rule will flag them.
- Import from the source file directly: `import { Button } from "@/components/ui/button"`, not from `@/components/ui`.
- Exception: shadcn-generated `src/components/ui/*` is leaf-only — that's fine.

### Server-first
- Prefer Server Components and Server Actions over `app/api/*` routes.
- **Do not `useEffect` to fetch data.** Fetch in a Server Component or call a Server Action.
- Add TanStack Query only when you have a genuine client-side cache need (polling, optimistic updates, infinite, shared cache).

### shadcn/ui
- Add primitives via `pnpm dlx shadcn@latest add <name>`.
- **Never hand-edit `src/components/ui/*`.** Regenerate if a primitive needs upgrading. Wrap in `src/components/features/` if you need behavior changes.
- Match shadcn style (Tailwind, CVA variants, `cn()` from `@/lib/utils`).

### Forms — canonical pattern

See `src/app/(app)/example/` for a complete example. The contract:

1. Schema in `_schemas/<name>.ts` exporting both the Zod schema and the inferred type.
2. Server action in `_actions/<verb-noun>.ts`:
   - `"use server"` on line 1.
   - Wrap with `action` from `@/lib/safe-action` (`action.inputSchema(...).action(async ({ parsedInput }) => {...})`).
   - Call `api.post(...)` against the Go backend with a Zod response schema.
3. Client component in `_components/<name>-form.tsx`:
   - `"use client"` on line 1.
   - `useActionState` + Conform's `useForm` + `getFormProps`/`getInputProps` helpers — **no `as` casts**.

The **same Zod schema runs on both sides.** Do not duplicate validation.

### Calling the Go backend

Always go through `src/lib/api/client.ts`:

```ts
import { z } from "zod";
import { api } from "@/lib/api/client";

const UserSchema = z.object({ id: z.string(), name: z.string() });
const user = await api.get(`/users/${id}`, UserSchema);
```

- Cookies and `Authorization` are forwarded automatically from the incoming request to the Go API.
- Responses are validated with the Zod schema you pass in. **Do not skip the schema.**
- Auth lives in Go. Do not add NextAuth / session DBs / middleware-based auth.

### Type safety
- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch` all on.
- `noNonNullAssertion`, `noExplicitAny` are Biome errors.
- **Do not satisfy the compiler with `as` or `!`.** Narrow the type with a real check, or use a helper (`getInputProps` from Conform, `safeParse` from Zod, etc.).
- Validate at boundaries: form data → Zod, API responses → Zod, env vars → `@/env`.

### Environment variables
- Defined and validated in `src/env.ts` via `@t3-oss/env-nextjs`.
- **Never** access `process.env.X` directly outside `src/env.ts`. Import `env` instead.
- Public vars must be `NEXT_PUBLIC_*` and declared in the `client` block of `createEnv`.

## Testing

### Unit / component (Vitest + RTL + MSW)
- Co-locate as `foo.test.ts(x)` next to the source.
- MSW server starts automatically in `vitest.setup.ts`. Default handlers in `src/test/msw/handlers.ts`. Override per test with `server.use(...)`.
- For server actions, test the underlying logic (Zod parsing, the api call against an MSW handler).
- For client components, render with `@testing-library/react`, use `userEvent`, assert with `screen.getByRole(...)`.

### E2E (Playwright)
- Specs in `tests/e2e/*.spec.ts`.
- First time: `pnpm test:e2e:install` to install browsers.
- Use role/label selectors, not CSS classes.

## Security
- Never log secrets, tokens, cookies, or PII.
- Env access only via `@/env`.
- Authorize in Server Actions (and trust Go for the actual check). Don't put auth in middleware.
- Do not commit `.env.local`.

## Do / Don't

**DO**
- Use Server Actions wrapped with `action` from `@/lib/safe-action`
- Co-locate route-scoped code under `_components/_actions/_schemas`
- Validate every API boundary with a Zod schema
- Run `pnpm verify` before declaring work done
- Add an MSW handler whenever you add an `api.*()` call

**DON'T**
- Don't add `pages/` — App Router only
- Don't `useEffect` to fetch data — use Server Components or a Server Action
- Don't hand-edit `src/components/ui/*` — regenerate
- Don't add barrel `index.ts` files
- Don't add Mantine, Prisma, a DB, NextAuth, or extra UI kits — the stack is locked
- Don't use `!` non-null assertion or `as` to silence the type checker — narrow instead
- Don't access `process.env.*` outside `src/env.ts`
- Don't install TanStack Query / Zustand / Storybook speculatively — add when actually needed

## PR & commit

- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- PR title is imperative, under 70 chars.
- Body: summary + test plan checklist.
- CI must pass `pnpm verify` (and Playwright on PRs) before merge.
