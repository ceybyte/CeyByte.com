import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { FALLBACK_RELEASE } from "../src/lib/fallback-release";

const ORIGIN = "http://localhost:3000";

const call = (path: string, headers?: Record<string, string>) => {
  return exports.default.fetch(`${ORIGIN}${path}`, {
    headers,
    redirect: "manual",
  });
};

describe("Failure Drills & Graceful Degradation (07 §299)", () => {
  it("serves FALLBACK_RELEASE when D1 has no release record", async () => {
    // Clear release cache and release rows
    await env.CACHE_KV.delete("release:latest");
    await env.DB.prepare("DELETE FROM releases").run();

    const res = await call("/api/releases/latest");
    expect(res.status).toBe(200);

    const json = (await res.json()) as { ok: boolean; data: { version: string; download_url: string } };
    expect(json.ok).toBe(true);
    expect(json.data.version).toBe(FALLBACK_RELEASE.version);
    expect(json.data.download_url).toBe(FALLBACK_RELEASE.download_url);
  });

  it("redirects /api/download/latest to fallback download URL when D1 is empty", async () => {
    await env.CACHE_KV.delete("release:latest");
    await env.DB.prepare("DELETE FROM releases").run();

    const res = await call("/api/download/latest");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe(FALLBACK_RELEASE.download_url);
  });

  it("returns valid empty FeatureCollection when geo cache is cleared and no merchants exist", async () => {
    await env.CACHE_KV.delete("geo:version");
    await env.DB.prepare("DELETE FROM merchants").run();

    const res = await call("/api/merchants/geo");
    expect(res.status).toBe(200);

    const data = (await res.json()) as { type: string; features: unknown[] };
    expect(data.type).toBe("FeatureCollection");
    expect(Array.isArray(data.features)).toBe(true);
  });
});
