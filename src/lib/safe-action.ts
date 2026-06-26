import { createSafeActionClient } from "next-safe-action";
import { ApiError } from "@/lib/api/errors";

/**
 * Friendly messages for known BFF error codes (stable contract identifiers, not
 * sensitive free-form text). Anything unrecognized falls back to a status-based
 * generic so raw upstream messages are never echoed to the client.
 */
const KNOWN_CODE_MESSAGES: Record<string, string> = {
  aggregator_not_resolved:
    "This feed can't accept on-chain requests yet — its aggregator hasn't been indexed. Try again shortly.",
  asset_not_tracked: "That asset isn't tracked.",
  chain_id_mismatch: "Network mismatch with the API. Switch networks and try again.",
};

export const action = createSafeActionClient({
  handleServerError(e) {
    // Log the full error server-side only.
    console.error("[server-action]", e);
    // Never echo raw upstream messages to the client — map to safe, generic text.
    if (e instanceof ApiError) {
      const known = KNOWN_CODE_MESSAGES[e.code];
      if (known) return known;
      if (e.status === 404) return "Not found.";
      if (e.status === 400) return "Invalid request.";
      if (e.status === 503) return "Service temporarily unavailable. Try again shortly.";
      return "The upstream service could not handle that request.";
    }
    return "Something went wrong. Please try again.";
  },
});
