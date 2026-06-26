import { createSafeActionClient } from "next-safe-action";
import { ApiError } from "@/lib/api/errors";

export const action = createSafeActionClient({
  handleServerError(e) {
    // Log the full error server-side only.
    console.error("[server-action]", e);
    // Never echo raw upstream messages to the client — map to safe, generic text.
    if (e instanceof ApiError) {
      if (e.status === 404) return "Not found.";
      if (e.status === 400) return "Invalid request.";
      if (e.status === 503) return "Service temporarily unavailable. Try again shortly.";
      return "The upstream service could not handle that request.";
    }
    return "Something went wrong. Please try again.";
  },
});
