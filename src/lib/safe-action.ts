import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  handleServerError(e) {
    console.error("[server-action]", e);
    return e.message;
  },
});
