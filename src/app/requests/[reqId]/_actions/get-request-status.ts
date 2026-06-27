"use server";

import { z } from "zod";
import { ApiError } from "@/lib/api/errors";
import { getRequest } from "@/lib/api/oracle";
import { action } from "@/lib/safe-action";

const inputSchema = z.object({
  reqId: z.string().regex(/^\d+$/, "req_id must be a base-10 uint256"),
});

/**
 * Fetches the lifecycle status of a price request. The client polls this every
 * few seconds until the request is fulfilled or failed. A 404 (not yet observed
 * by the indexer) resolves to `null` rather than throwing, so polling can keep
 * going while the request propagates.
 */
export const getRequestStatusAction = action
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await getRequest(parsedInput.reqId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  });
