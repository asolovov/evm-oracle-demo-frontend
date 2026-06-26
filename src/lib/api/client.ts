import "server-only";
import { cookies, headers } from "next/headers";
import type { z } from "zod";
import { env } from "@/env";
import { ApiError } from "./errors";

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
};

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, env.NEXT_PUBLIC_API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function forwardAuthHeaders(): Promise<Record<string, string>> {
  // Forward cookies + Authorization from the incoming request to the Go backend.
  // Auth lives in Go — Next.js is a pass-through.
  const out: Record<string, string> = {};
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (cookieHeader) out.cookie = cookieHeader;

  const incoming = await headers();
  const auth = incoming.get("authorization");
  if (auth) out.authorization = auth;

  return out;
}

async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  opts: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, opts.query);
  const authHeaders = await forwardAuthHeaders();
  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...authHeaders,
      ...opts.headers,
    },
    ...(opts.cache ? { cache: opts.cache } : {}),
    ...(opts.next ? { next: opts.next } : {}),
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  };

  const res = await fetch(url, init);
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body (gateway HTML, truncated response): surface as ApiError
      // so callers' graceful-degradation paths handle it instead of a raw throw.
      throw new ApiError(res.status, "invalid_json", res.statusText || "Invalid response", text);
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: unknown }).message)
        : res.statusText;
    const code =
      typeof data === "object" && data && "code" in data
        ? String((data as { code: unknown }).code)
        : "api_error";
    throw new ApiError(res.status, code, message, data);
  }

  return schema.parse(data);
}

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>, opts?: Omit<FetchOptions, "method" | "body">) =>
    apiFetch(path, schema, { ...opts, method: "GET" }),
  post: <T>(
    path: string,
    schema: z.ZodType<T>,
    body: unknown,
    opts?: Omit<FetchOptions, "method">,
  ) => apiFetch(path, schema, { ...opts, method: "POST", body }),
  put: <T>(
    path: string,
    schema: z.ZodType<T>,
    body: unknown,
    opts?: Omit<FetchOptions, "method">,
  ) => apiFetch(path, schema, { ...opts, method: "PUT", body }),
  patch: <T>(
    path: string,
    schema: z.ZodType<T>,
    body: unknown,
    opts?: Omit<FetchOptions, "method">,
  ) => apiFetch(path, schema, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, schema: z.ZodType<T>, opts?: Omit<FetchOptions, "method" | "body">) =>
    apiFetch(path, schema, { ...opts, method: "DELETE" }),
};
