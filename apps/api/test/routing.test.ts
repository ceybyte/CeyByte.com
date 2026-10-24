import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { resolveLocale } from "../src/index";

describe("Worker routing & locale redirects (Phase 3)", () => {
  describe("resolveLocale helper", () => {
    it("respects NEXT_LOCALE cookie when valid", () => {
      expect(resolveLocale("si", "en-US")).toBe("si");
      expect(resolveLocale("ta", "si-LK")).toBe("ta");
      expect(resolveLocale("en", "si-LK")).toBe("en");
    });

    it("ignores invalid cookie and falls back to Accept-Language", () => {
      expect(resolveLocale("fr", "si-LK,si;q=0.9")).toBe("si");
      expect(resolveLocale("invalid", "ta,en-US;q=0.8")).toBe("ta");
    });

    it("matches Accept-Language with priority si > ta > en", () => {
      expect(resolveLocale(undefined, "si-LK,en-US;q=0.9")).toBe("si");
      expect(resolveLocale(undefined, "ta-LK,en-US;q=0.9")).toBe("ta");
      expect(resolveLocale(undefined, "en-US,en;q=0.9")).toBe("en");
    });

    it("defaults to en when no headers or matches", () => {
      expect(resolveLocale(undefined, undefined)).toBe("en");
      expect(resolveLocale(undefined, "fr-FR,de;q=0.5")).toBe("en");
    });
  });

  describe("GET / redirect", () => {
    it("redirects to /si/ with 307 when Accept-Language is Sinhala", async () => {
      const res = await exports.default.fetch("https://ceybyte.com/", {
        headers: { "Accept-Language": "si-LK,si;q=0.9" },
        redirect: "manual",
      });
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("/si/");
    });

    it("redirects to /ta/ with 307 when Accept-Language is Tamil", async () => {
      const res = await exports.default.fetch("https://ceybyte.com/", {
        headers: { "Accept-Language": "ta-LK,ta;q=0.9" },
        redirect: "manual",
      });
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("/ta/");
    });

    it("redirects to /en/ with 307 as default", async () => {
      const res = await exports.default.fetch("https://ceybyte.com/", {
        redirect: "manual",
      });
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("/en/");
    });

    it("prioritises NEXT_LOCALE cookie over Accept-Language", async () => {
      const res = await exports.default.fetch("https://ceybyte.com/", {
        headers: {
          cookie: "NEXT_LOCALE=ta",
          "Accept-Language": "si-LK",
        },
        redirect: "manual",
      });
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("/ta/");
    });
  });
});
