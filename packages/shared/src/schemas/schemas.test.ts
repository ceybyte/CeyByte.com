import { describe, expect, it } from "bun:test";
import { DownloadGateSchema, Step1ShopSchema, Step2LocationSchema } from "./download-gate";
import { Manifest } from "./manifest";

describe("Shared Schemas", () => {
  describe("Manifest Schema", () => {
    it("validates valid GitHub release latest.json", () => {
      const valid = {
        version: "1.3.0",
        release_date: "2026-09-27",
        download_url:
          "https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe",
        changelog: "Fixes shift report printer issue",
        min_version: "Windows 10 or later",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 52428800,
        published_at: "2026-09-27T10:00:00Z",
      };

      const result = Manifest.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid download URLs or missing sha256", () => {
      const invalidUrl = {
        version: "1.3.0",
        release_date: "2026-09-27",
        download_url: "https://example.com/CBPOSSetup-1.3.0.exe",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      };
      expect(Manifest.safeParse(invalidUrl).success).toBe(false);

      const invalidSha = {
        version: "1.3.0",
        release_date: "2026-09-27",
        download_url:
          "https://github.com/ceybyte/cbpos-releases/releases/download/v1.3.0/CBPOSSetup-1.3.0.exe",
        sha256: "short-sha",
      };
      expect(Manifest.safeParse(invalidSha).success).toBe(false);
    });
  });

  describe("DownloadGate Schema", () => {
    const validStep1 = {
      fullName: "Kamal Perera",
      shopName: "Perera Grocery",
      category: "grocery" as const,
      phone: "077 123 4567",
      whatsapp: "077 123 4567",
    };

    const validStep2 = {
      district: "colombo" as const,
      city: "Colombo",
      lat: 6.9271,
      lng: 79.8612,
      locationSource: "pin" as const,
      isPublicOnMap: false,
      termsAccepted: true as const,
      termsVersion: "2026-10-01",
      preferredLocale: "en" as const,
    };

    it("validates and normalises Step 1 data", () => {
      const parsed = Step1ShopSchema.safeParse(validStep1);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.phone).toBe("+94771234567");
        expect(parsed.data.whatsapp).toBe("+94771234567");
      }
    });

    it("accepts landline for phone but rejects landline for whatsapp", () => {
      const landline = {
        ...validStep1,
        phone: "011 234 5678",
        whatsapp: "011 234 5678",
      };
      const parsed = Step1ShopSchema.safeParse(landline);
      expect(parsed.success).toBe(false);

      const landlinePhoneOnly = {
        ...validStep1,
        phone: "011 234 5678",
        whatsapp: "",
      };
      const validParsed = Step1ShopSchema.safeParse(landlinePhoneOnly);
      expect(validParsed.success).toBe(true);
      if (validParsed.success) {
        expect(validParsed.data.phone).toBe("+94112345678");
        expect(validParsed.data.whatsapp).toBeNull();
      }
    });

    it("validates Step 2 and rejects coordinates outside Sri Lanka bounds", () => {
      expect(Step2LocationSchema.safeParse(validStep2).success).toBe(true);

      const outOfBounds = {
        ...validStep2,
        lat: 12.5, // outside Sri Lanka
      };
      expect(Step2LocationSchema.safeParse(outOfBounds).success).toBe(false);

      const termsNotAccepted = {
        ...validStep2,
        termsAccepted: false,
      };
      expect(Step2LocationSchema.safeParse(termsNotAccepted).success).toBe(false);
    });

    it("validates full DownloadGate submission", () => {
      const full = { ...validStep1, ...validStep2 };
      const parsed = DownloadGateSchema.safeParse(full);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.phone).toBe("+94771234567");
        expect(parsed.data.isPublicOnMap).toBe(false);
      }
    });
  });
});
