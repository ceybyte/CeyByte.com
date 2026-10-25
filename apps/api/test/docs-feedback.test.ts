import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

describe("Docs Feedback API", () => {
  it("POST /api/docs/feedback accepts valid feedback", async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/docs/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        articleSlug: "install",
        categorySlug: "getting-started",
        locale: "en",
        helpful: true,
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("POST /api/docs/feedback accepts negative feedback with optional reason", async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/docs/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        articleSlug: "smartscreen",
        categorySlug: "getting-started",
        locale: "si",
        helpful: false,
        reason: "Need clearer step for Windows 11 Home",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("POST /api/docs/feedback rejects invalid payload with 422", async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/docs/feedback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        // Missing required fields
        helpful: "not-a-boolean",
      }),
    });

    expect(res.status).toBe(422);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });
});
