import { afterEach, describe, expect, it, vi } from "vitest";
import { cached, clearCache } from "@/lib/chain/ttl-cache";

afterEach(() => clearCache());

describe("cached", () => {
  it("returns the cached value within the TTL (one fn call)", async () => {
    let now = 1000;
    const fn = vi.fn(async () => "v1");
    const a = await cached("k", 100, fn, () => now);
    now = 1050; // still within TTL
    const b = await cached("k", 100, fn, () => now);
    expect(a).toBe("v1");
    expect(b).toBe("v1");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("recomputes after the TTL expires", async () => {
    let now = 0;
    const fn = vi.fn(async () => now);
    await cached("k", 100, fn, () => now);
    now = 101; // past TTL
    const second = await cached("k", 100, fn, () => now);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(second).toBe(101);
  });

  it("dedupes concurrent callers onto one in-flight promise", async () => {
    const now = 0;
    const fn = vi.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve("shared"), 5)),
    );
    const [a, b] = await Promise.all([
      cached("k", 100, fn, () => now),
      cached("k", 100, fn, () => now),
    ]);
    expect(a).toBe("shared");
    expect(b).toBe("shared");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT cache failures — evicts so the next call retries", async () => {
    const now = 0;
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("ok");
    await expect(cached("k", 100, fn, () => now)).rejects.toThrow("boom");
    const second = await cached("k", 100, fn, () => now); // same TTL window
    expect(second).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
