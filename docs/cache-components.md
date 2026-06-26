# Cache Components (PPR) — opt-in checklist

This template ships with `cacheComponents: false` in `next.config.ts`. PPR / Cache Components is the future rendering model but has silent failure modes that current AI training data does not cover well. Enable when your team is ready to own the footguns.

## Before enabling

1. Read [the official Cache Components guide](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering) (also in `node_modules/next/dist/docs/`).
2. Audit every `await` in a Server Component — anything dynamic must live inside a `<Suspense>` boundary.
3. Decide your cache tags up front. Every cacheable read should call `cacheTag()` so you can `revalidateTag()` later.

## Known footguns (May 2026)

- `"use cache"` is **silently ignored in dynamic routes** ([next.js#85240](https://github.com/vercel/next.js/issues/85240)). Verify caching with the build output or a debug overlay, not by trust.
- Putting `"use cache"` on a wrapper component instead of the data function silently does nothing.
- `cacheLife("seconds")` silently excludes a component from the static shell — there is no warning.
- Missing `cacheTag()` makes on-demand revalidation impossible.
- Dev-time visibility of cache behavior is poor; rely on `next build` output.

## Enable

```ts
// next.config.ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  cacheComponents: true, // was false
};
```

Then convert reads:

```tsx
async function getUser(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`user:${id}`);
  return api.get(`/users/${id}`, UserSchema);
}
```

Wrap dynamic parts in `<Suspense>` with a real fallback. Run `pnpm build` and read the route output — every page must show some prerendered shell.
