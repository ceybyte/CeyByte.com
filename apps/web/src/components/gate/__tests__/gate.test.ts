/// <reference types="bun-types" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";
import { DISTRICTS, SRI_LANKA_BOUNDS } from "@cbpos/shared/enums";
import {
  Step1ShopSchema,
  Step2LocationSchema,
  DownloadGateSchema,
} from "@cbpos/shared/schemas/download-gate";
import { DISTRICT_CENTROIDS } from "../mini-map";

function loadMessages(locale: string): Record<string, unknown> {
  const root = resolve(__dirname, "../../../../../..");
  const path = resolve(root, `messages/${locale}.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

describe("Download Gate & Releases Validation and Parity", () => {
  it("verifies all 25 districts have centroids strictly inside Sri Lanka bounding box", () => {
    expect(DISTRICTS.length).toBe(25);
    const { minLat, maxLat, minLng, maxLng } = SRI_LANKA_BOUNDS;

    for (const district of DISTRICTS) {
      const centroid = DISTRICT_CENTROIDS[district];
      expect(centroid).toBeDefined();
      if (centroid) {
        expect(centroid.lat).toBeGreaterThanOrEqual(minLat);
        expect(centroid.lat).toBeLessThanOrEqual(maxLat);
        expect(centroid.lng).toBeGreaterThanOrEqual(minLng);
        expect(centroid.lng).toBeLessThanOrEqual(maxLng);
      }
    }
  });

  it("validates Step 1 shop schema with valid Sri Lankan mobile and landline numbers", () => {
    const valid = Step1ShopSchema.safeParse({
      fullName: "Kasun Perera",
      shopName: "Kasun Grocery",
      category: "grocery",
      phone: "0771234567",
      whatsapp: "0771234567",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.phone).toBe("+94771234567");
      expect(valid.data.whatsapp).toBe("+94771234567");
    }

    const invalidPhone = Step1ShopSchema.safeParse({
      fullName: "Kasun Perera",
      shopName: "Kasun Grocery",
      category: "grocery",
      phone: "12345",
    });
    expect(invalidPhone.success).toBe(false);
  });

  it("validates Step 2 location schema enforcing PDPA privacy defaults and terms acceptance", () => {
    const valid = Step2LocationSchema.safeParse({
      district: "colombo",
      city: "Colombo 01",
      lat: 6.9271,
      lng: 79.8612,
      locationSource: "pin",
      termsAccepted: true,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      // Must default to false per PDPA privacy requirement
      expect(valid.data.isPublicOnMap).toBe(false);
      expect(valid.data.termsVersion).toBe("2026-10-01");
    }

    // Terms unaccepted must fail
    const unaccepted = Step2LocationSchema.safeParse({
      district: "colombo",
      city: "Colombo 01",
      lat: 6.9271,
      lng: 79.8612,
      locationSource: "pin",
      termsAccepted: false,
    });
    expect(unaccepted.success).toBe(false);

    // Coordinates outside Sri Lanka must fail
    const outside = Step2LocationSchema.safeParse({
      district: "colombo",
      city: "Colombo 01",
      lat: 1.29027, // Singapore
      lng: 103.851959,
      locationSource: "pin",
      termsAccepted: true,
    });
    expect(outside.success).toBe(false);
  });

  it("verifies composite DownloadGateSchema handles complete merchant submission", () => {
    const full = DownloadGateSchema.safeParse({
      fullName: "Nimal Silva",
      shopName: "Silva Stores",
      category: "minimart",
      phone: "0112345678", // landline
      district: "gampaha",
      city: "Negombo",
      lat: 7.2083,
      lng: 79.8358,
      locationSource: "gps",
      isPublicOnMap: true,
      termsAccepted: true,
      termsVersion: "2026-10-01",
      preferredLocale: "si",
    });
    expect(full.success).toBe(true);
    if (full.success) {
      expect(full.data.phone).toBe("+94112345678");
      expect(full.data.isPublicOnMap).toBe(true);
      expect(full.data.preferredLocale).toBe("si");
    }
  });

  it("ensures gate and releases translation sections exist across en, si, and ta catalogs", () => {
    for (const locale of ["en", "si", "ta"]) {
      const msgs = loadMessages(locale);
      expect(msgs.gate).toBeDefined();
      expect(msgs.releases).toBeDefined();
      expect(msgs.categories).toBeDefined();
      expect(msgs.districts).toBeDefined();

      const gate = msgs.gate as Record<string, unknown>;
      expect(gate.step).toBeDefined();
      expect(gate.s1).toBeDefined();
      expect(gate.s2).toBeDefined();
      expect(gate.done).toBeDefined();

      const releases = msgs.releases as Record<string, unknown>;
      expect(releases.title).toBeDefined();
      expect(releases.lead).toBeDefined();
      expect(releases.latest).toBeDefined();
    }
  });
});
