import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { submitContact } from "./submit-contact";

describe("submitContact action", () => {
  it("returns the created id and name on success", async () => {
    const result = await submitContact({
      name: "Andrei",
      email: "andrei@example.com",
      message: "Hello, this is a valid message body.",
    });

    expect(result?.data).toEqual({ id: "c_1", name: "Andrei" });
  });

  it("returns validation errors when input is invalid", async () => {
    const result = await submitContact({
      name: "",
      email: "not-an-email",
      message: "short",
    });

    expect(result?.validationErrors).toBeDefined();
    expect(result?.data).toBeUndefined();
  });

  it("surfaces a server error when the API rejects the request", async () => {
    server.use(
      http.post("*/contacts", () =>
        HttpResponse.json({ code: "rate_limited", message: "Too many" }, { status: 429 }),
      ),
    );

    const result = await submitContact({
      name: "Andrei",
      email: "andrei@example.com",
      message: "Hello, this is a valid message body.",
    });

    expect(result?.serverError).toBeDefined();
    expect(result?.data).toBeUndefined();
  });
});
