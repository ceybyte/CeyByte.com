import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { hmacSha256Hex } from "../src/lib/crypto";

const ORIGIN = "http://localhost:3000";

describe("GitHub Webhook Handler", () => {
  const secret = env.GITHUB_WEBHOOK_SECRET;

  it("rejects request without signature with 400", async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/webhooks/github`, {
      method: "POST",
      body: JSON.stringify({ action: "published" }),
    });
    expect(res.status).toBe(400);
    const json: { ok: boolean; error: { code: string } } = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("SIGNATURE_INVALID");
  });

  it("rejects request with invalid HMAC signature", async () => {
    const body = JSON.stringify({ action: "published" });
    const res = await exports.default.fetch(`${ORIGIN}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "x-hub-signature-256": "sha256=invalidhex0123456789",
        "x-github-event": "release",
        "content-type": "application/json",
      },
      body,
    });
    expect(res.status).toBe(400);
  });

  it("accepts valid release webhook with valid HMAC signature", async () => {
    const payload = JSON.stringify({
      action: "published",
      release: { tag_name: "v1.3.0" },
    });
    const hex = await hmacSha256Hex(secret, payload);

    const res = await exports.default.fetch(`${ORIGIN}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "x-hub-signature-256": `sha256=${hex}`,
        "x-github-event": "release",
        "content-type": "application/json",
      },
      body: payload,
    });
    expect(res.status).toBe(202);
    const json: { ok: boolean; data: { status: string } } = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("accepted");
  });

  it("ignores non-release events cleanly with 202", async () => {
    const payload = JSON.stringify({ action: "opened" });
    const hex = await hmacSha256Hex(secret, payload);

    const res = await exports.default.fetch(`${ORIGIN}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "x-hub-signature-256": `sha256=${hex}`,
        "x-github-event": "push",
        "content-type": "application/json",
      },
      body: payload,
    });
    expect(res.status).toBe(202);
    const json: { ok: boolean; data: { status: string } } = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("ignored");
  });
});
