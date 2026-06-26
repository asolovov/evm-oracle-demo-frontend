import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
});

export type ContactInput = z.infer<typeof contactSchema>;
