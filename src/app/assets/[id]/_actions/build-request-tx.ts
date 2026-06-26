"use server";

import { z } from "zod";
import { CHAIN } from "@/config/chain";
import { buildRequestTx } from "@/lib/api/oracle";
import { action } from "@/lib/safe-action";

const inputSchema = z.object({ assetId: z.string().min(1) });

/**
 * Builds the `requestPrice` calldata via the BFF for the configured chain. The
 * BFF never submits — the client signs and broadcasts the returned tuple.
 */
export const buildRequestTxAction = action
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => buildRequestTx(parsedInput.assetId, CHAIN.id));
