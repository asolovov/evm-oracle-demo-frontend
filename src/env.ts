import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    /**
     * Public JSON-RPC endpoint for read-only on-chain calls (latestRoundData,
     * reporter set, etc.). Server-only on purpose — reads happen server-side, so
     * the URL is never inlined into the client bundle. Defaults to a public
     * Sepolia node.
     */
    RPC_URL: z.string().url().default("https://ethereum-sepolia-rpc.publicnode.com"),
  },
  client: {
    /** Base URL of the Go BFF (`evm-oracle-demo-api`). Used by the server-side API client. */
    NEXT_PUBLIC_API_URL: z.string().url(),
    /**
     * Browser-reachable WebSocket base for `/ws/stream`. Optional — when unset
     * it is derived from NEXT_PUBLIC_API_URL by swapping http→ws.
     */
    NEXT_PUBLIC_WS_URL: z.string().url().optional(),
    /** Target chain id. Defaults to Ethereum Sepolia (11155111). */
    NEXT_PUBLIC_CHAIN_ID: z.coerce.number().int().positive().default(11155111),
    /** Human-readable chain name shown in the header pill. */
    NEXT_PUBLIC_CHAIN_NAME: z.string().default("Ethereum Sepolia"),
    /** Block-explorer base, no trailing slash. */
    NEXT_PUBLIC_EXPLORER_URL: z.string().url().default("https://sepolia.etherscan.io"),
    /** Upwork profile URL. The footer/about Upwork link renders only when set (OQ-09). */
    NEXT_PUBLIC_UPWORK_URL: z.string().url().optional(),
    /** Canonical site URL — used as the metadata base for OG/canonical links. */
    NEXT_PUBLIC_SITE_URL: z.string().url().default("https://oracle-demo-orcin.vercel.app"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME,
    NEXT_PUBLIC_EXPLORER_URL: process.env.NEXT_PUBLIC_EXPLORER_URL,
    NEXT_PUBLIC_UPWORK_URL: process.env.NEXT_PUBLIC_UPWORK_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  emptyStringAsUndefined: true,
});
