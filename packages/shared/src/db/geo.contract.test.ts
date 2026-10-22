import { describe, expect, it } from "bun:test";
import { getTableColumns } from "drizzle-orm";
import { PUBLIC_GEO_COLUMNS, PUBLIC_GEO_PROPERTIES, toGeoFeature } from "./projections";
import { merchants } from "./schema";

// 05-SCHEMA §7.3 guard rail 1. A fixture with every merchant column, private ones included.
const row: Record<keyof typeof merchants.$inferSelect, unknown> = {
  id: "0b6f6f1c-6a51-4b8e-9b0a-2f1d7c1f4e11",
  publicId: "m_7Kq3P9",
  ownerUserId: "user-1",
  fullName: "Nimal Perera",
  phone: "+94771234567",
  whatsapp: "+94771234567",
  telegram: "@nimal",
  shopName: "Perera Stores",
  category: "grocery",
  district: "colombo",
  city: "Maharagama",
  lat: 6.848123,
  lng: 79.926789,
  locationSource: "gps",
  isPublicOnMap: true,
  status: "listed",
  isSupporter: true,
  supporterSince: new Date("2026-09-01T00:00:00Z"),
  termsVersion: "2026-10-01",
  termsAcceptedAt: new Date("2026-10-01T00:00:00Z"),
  claimTokenHash: "a".repeat(64),
  claimRedeemedAt: null,
  preferredLocale: "si",
  createdAt: new Date("2026-10-05T08:00:00Z"),
  updatedAt: new Date("2026-10-05T08:00:00Z"),
  deletedAt: null,
};

describe("public geo projection", () => {
  it("covers every column of the merchants table in the fixture", () => {
    expect(Object.keys(row).sort()).toEqual(Object.keys(getTableColumns(merchants)).sort());
  });

  it("selects only whitelisted columns", () => {
    expect(Object.keys(PUBLIC_GEO_COLUMNS).sort()).toEqual(
      [
        "publicId",
        "shopName",
        "category",
        "district",
        "city",
        "lat",
        "lng",
        "isSupporter",
        "createdAt",
      ].sort(),
    );
  });

  it("emits exactly the public properties and nothing private", () => {
    const feature = toGeoFeature(row as Parameters<typeof toGeoFeature>[0]);
    expect(Object.keys(feature.properties)).toEqual([...PUBLIC_GEO_PROPERTIES]);

    const json = JSON.stringify(feature);
    for (const banned of ["+94", "phone", "whatsapp", "telegram", "fullName", "Nimal", "@nimal", "claim"]) {
      expect(json).not.toContain(banned);
    }
  });

  it("rounds coordinates to 4 dp and reports the month as since", () => {
    const feature = toGeoFeature(row as Parameters<typeof toGeoFeature>[0]);
    expect(feature.geometry.coordinates).toEqual([79.9268, 6.8481]);
    expect(feature.properties.since).toBe("2026-10");
  });
});
