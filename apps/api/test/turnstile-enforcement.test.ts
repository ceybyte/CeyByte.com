import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

const call = (
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
) => {
  return exports.default.fetch(`${ORIGIN}${path}`, {
    method: options.method ?? "GET",
    headers: options.headers,
    body: options.body,
    redirect: "manual",
  });
};

describe("Turnstile Route Enforcement", () => {
  it("rejects POST /api/downloads with 403 when turnstileToken is missing", async () => {
    const payload = {
      fullName: "Nimal Perera",
      shopName: "Nimal Stores",
      category: "grocery",
      phone: "0771234567",
      district: "colombo",
      city: "Pettah",
      lat: 6.9344,
      lng: 79.8541,
      termsAccepted: true,
      // turnstileToken missing
    };

    const res = await call("/api/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(403);
    const data = (await res.json()) as { error?: { code?: string } };
    expect(data.error?.code).toBe("TURNSTILE_FAILED");
  });

  it("rejects POST /api/downloads with 403 when Turnstile verification fails on Cloudflare siteverify", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.includes("challenges.cloudflare.com/turnstile/v0/siteverify")) {
        return new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }));
      }
      return originalFetch(input, init);
    };

    try {
      const payload = {
        turnstileToken: "invalid-token",
        fullName: "Nimal Perera",
        shopName: "Nimal Stores",
        category: "grocery",
        phone: "0771234567",
        district: "colombo",
        city: "Pettah",
        lat: 6.9344,
        lng: 79.8541,
        termsAccepted: true,
      };

      const res = await call("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as { error?: { code?: string } };
      expect(data.error?.code).toBe("TURNSTILE_FAILED");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
