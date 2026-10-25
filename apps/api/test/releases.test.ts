import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const ORIGIN = "http://localhost:3000";

const call = (path: string, headers?: Record<string, string>) => {
  return exports.default.fetch(`${ORIGIN}${path}`, {
    headers,
    redirect: "manual",
  });
};

type ReleaseLatestResponse = {
  ok: boolean;
  data: {
    id: string;
    version: string;
    download_url?: string;
    exe_url?: string;
    sha256: string;
  };
};

describe("Releases API Endpoints", () => {
  it("GET /api/releases/latest returns fallback when no releases in D1 or KV", async () => {
    await env.CACHE_KV.delete("release:latest");
    const res = await call("/api/releases/latest", { "cache-control": "no-cache" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");

    const json = (await res.json()) as ReleaseLatestResponse;
    expect(json.ok).toBe(true);
    expect(json.data.version).toBe("0.0.0-dev");
  });

  it("GET /api/releases/latest returns active D1 release and populates KV", async () => {
    await env.CACHE_KV.delete("release:latest");

    const now = Date.now();
    await env.DB.prepare(
      `
      INSERT INTO releases (
        id, version, channel, title, notes_md, min_os, release_date, published_at,
        exe_name, exe_url, exe_size, exe_sha256, is_latest, is_yanked, source, created_at, updated_at
      ) VALUES (
        'rel-test-1', '1.3.0', 'stable', 'CB POS v1.3.0', 'Changelog 1.3.0', 'Windows 10 or later',
        '2026-09-27', ?, 'CBPOSSetup-1.3.0.exe',
        'https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe',
        52428800, '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        1, 0, 'github_sync', ?, ?
      )
    `,
    )
      .bind(now, now, now)
      .run();

    const res = await call("/api/releases/latest", { "cache-control": "no-cache" });
    expect(res.status).toBe(200);
    const json = (await res.json()) as ReleaseLatestResponse;
    expect(json.ok).toBe(true);
    expect(json.data.version).toBe("1.3.0");

    // Verify KV is cached
    const cached = await env.CACHE_KV.get("release:latest", "json");
    expect(cached).not.toBeNull();
  });

  it("GET /api/download/latest redirects with 302 to installer asset", async () => {
    const res = await call("/api/download/latest?ref=m_testref");
    expect(res.status).toBe(302);
    const location = res.headers.get("location");
    expect(location).toContain("CBPOSSetup-1.3.0.exe");
  });
});
