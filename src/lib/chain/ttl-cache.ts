/**
 * Tiny in-memory TTL cache for server-side on-chain reads — the mechanism that
 * keeps RPC load affordable (task 09.1 load budget).
 *
 * It stores the in-flight *promise* per key, so concurrent callers within the
 * same render AND separate requests within the TTL window all share one RPC
 * round-trip. A rejected promise is evicted immediately so a transient RPC error
 * is never cached (the next call retries). Per-process (single-instance) — fine
 * for the single-VPS demo; gives no cross-instance sharing on multi-instance
 * hosting, which is acceptable here.
 *
 * `now` is injectable for deterministic tests.
 */
type Entry = { promise: Promise<unknown>; expires: number };

const store = new Map<string, Entry>();

export function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  now: () => number = Date.now,
): Promise<T> {
  const hit = store.get(key);
  // The store is heterogeneous (one Map keyed by string), so the value type is
  // erased to Promise<unknown>; the generic `cached<T>` re-applies the caller's
  // type. This is the one unavoidable cast — there's no per-key generic Map.
  if (hit && hit.expires > now()) return hit.promise as Promise<T>;

  const promise = fn();
  store.set(key, { promise, expires: now() + ttlMs });
  // Evict on failure so failures are never cached and the next call retries.
  promise.catch(() => {
    if (store.get(key)?.promise === promise) store.delete(key);
  });
  return promise;
}

/** Test helper — clear all cached entries. */
export function clearCache(): void {
  store.clear();
}
