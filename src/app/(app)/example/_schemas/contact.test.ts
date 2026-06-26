import { describe, expect, it } from "vitest";
import { contactSchema } from "./contact";

describe("contactSchema", () => {
  it("accepts a valid contact", () => {
    const result = contactSchema.safeParse({
      name: "Andrei",
      email: "andrei@example.com",
      message: "Hello, this is a valid message body.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short message", () => {
    const result = contactSchema.safeParse({
      name: "Andrei",
      email: "andrei@example.com",
      message: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["message"]);
    }
  });

  it("rejects an invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Andrei",
      email: "not-an-email",
      message: "Hello, this is a valid message body.",
    });
    expect(result.success).toBe(false);
  });
});
