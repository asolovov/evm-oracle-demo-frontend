import { HttpResponse, http } from "msw";

// Default handlers for tests. Override per-test via `server.use(...)`.
export const handlers = [
  http.post("*/contacts", async () => HttpResponse.json({ id: "c_1" }, { status: 201 })),
];
