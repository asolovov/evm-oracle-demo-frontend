"use server";

import { z } from "zod";
import { api } from "@/lib/api/client";
import { action } from "@/lib/safe-action";
import { contactSchema } from "../_schemas/contact";

const ContactResponseSchema = z.object({ id: z.string() });

export const submitContact = action.inputSchema(contactSchema).action(async ({ parsedInput }) => {
  const res = await api.post("/contacts", ContactResponseSchema, parsedInput);
  return { id: res.id, name: parsedInput.name };
});
