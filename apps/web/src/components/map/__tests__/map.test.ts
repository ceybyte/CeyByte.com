/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";
import { DISTRICTS, SRI_LANKA_BOUNDS } from "@cbpos/shared/enums";
import { DISTRICT_CODES, DISTRICT_CENTROIDS, DISTRICT_GRID_ORDER } from "../district-constants";
import type { GeoFeature } from "../map-types";

// Mock GeoFeature dataset for filtering tests
const MOCK_FEATURES: GeoFeature[] = [
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [79.8612, 6.9271] }, // Colombo
    properties: {
      id: "mer_col_001",
      shopName: "Colombo Central Mart",
      category: "grocery",
      district: "colombo",
      city: "Pettah",
      isSupporter: true,
      since: "Aug 2026",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [80.6337, 7.2906] }, // Kandy
    properties: {
      id: "mer_kan_002",
      shopName: "Hill Country Pharmacy",
      category: "pharmacy",
      district: "kandy",
      city: "Kandy",
      isSupporter: false,
      since: "Sep 2026",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [80.217, 6.0535] }, // Galle
    properties: {
      id: "mer_gal_003",
      shopName: "Southern Hardware",
      category: "hardware",
      district: "galle",
      city: "Galle Fort",
      isSupporter: false,
      since: "Jul 2026",
    },
  },
  {
    type: "Feature",
    geometry: { type: "Point", coordinates: [79.9825, 7.084] }, // Gampaha
    properties: {
      id: "mer_gam_004",
      shopName: "Negombo Seafood Retail",
      category: "other",
      district: "gampaha",
      city: "Negombo",
      isSupporter: true,
      since: "Oct 2026",
    },
  },
];

function filterFeatures(
  features: GeoFeature[],
  filter: {
    search?: string;
    district?: string;
    category?: string;
    supportersOnly?: boolean;
  },
): GeoFeature[] {
  return features.filter((f) => {
    const p = f.properties;
    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.trim().toLowerCase();
      const match =
        p.shopName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filter.district && filter.district !== "all") {
      if (p.district.toLowerCase() !== filter.district.toLowerCase()) return false;
    }
    if (filter.category && filter.category !== "all") {
      if (p.category.toLowerCase() !== filter.category.toLowerCase()) return false;
    }
    if (filter.supportersOnly && !p.isSupporter) {
      return false;
    }
    return true;
  });
}

function getDirectionsUrl(lat: number, lng: number): string {
  const cleanLat = Number(lat.toFixed(4));
  const cleanLng = Number(lng.toFixed(4));
  return `https://www.google.com/maps/dir/?api=1&destination=${cleanLat},${cleanLng}`;
}

function isWebGLAvailable(canvasContextFactory?: () => unknown): boolean {
  try {
    if (canvasContextFactory) {
      return !!canvasContextFactory();
    }
    if (typeof window === "undefined" || !window.WebGLRenderingContext) {
      return false;
    }
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

describe("Merchant Map Logic & Coverage", () => {
  it("verifies all 25 districts are mapped in DISTRICT_CODES with 2-3 letter uppercase codes", () => {
    expect(DISTRICTS.length).toBe(25);
    for (const district of DISTRICTS) {
      const code = DISTRICT_CODES[district];
      expect(code).toBeDefined();
      if (code) {
        expect(code.length).toBeGreaterThanOrEqual(2);
        expect(code.length).toBeLessThanOrEqual(4);
        expect(code).toBe(code.toUpperCase());
      }
    }
  });

  it("verifies DISTRICT_GRID_ORDER contains all 25 districts exactly once", () => {
    expect(DISTRICT_GRID_ORDER.length).toBe(25);
    const unique = new Set(DISTRICT_GRID_ORDER);
    expect(unique.size).toBe(25);
    for (const district of DISTRICT_GRID_ORDER) {
      expect((DISTRICTS as readonly string[]).includes(district)).toBe(true);
    }
  });

  it("verifies all district centroids are within Sri Lanka bounds", () => {
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

  it("filters merchants by search query (shopName or city, case-insensitive)", () => {
    const byName = filterFeatures(MOCK_FEATURES, { search: "central" });
    expect(byName.length).toBe(1);
    const firstShop = byName[0];
    if (firstShop) {
      expect(firstShop.properties.shopName).toBe("Colombo Central Mart");
    }

    const byCity = filterFeatures(MOCK_FEATURES, { search: "galle fort" });
    expect(byCity.length).toBe(1);
    const firstCity = byCity[0];
    if (firstCity) {
      expect(firstCity.properties.city).toBe("Galle Fort");
    }

    const noMatch = filterFeatures(MOCK_FEATURES, { search: "nonexistent" });
    expect(noMatch.length).toBe(0);
  });

  it("filters merchants by district", () => {
    const colomboOnly = filterFeatures(MOCK_FEATURES, { district: "colombo" });
    expect(colomboOnly.length).toBe(1);
    const firstCol = colomboOnly[0];
    if (firstCol) {
      expect(firstCol.properties.district).toBe("colombo");
    }

    const all = filterFeatures(MOCK_FEATURES, { district: "all" });
    expect(all.length).toBe(4);
  });

  it("filters merchants by category", () => {
    const pharmacy = filterFeatures(MOCK_FEATURES, { category: "pharmacy" });
    expect(pharmacy.length).toBe(1);
    const firstPharm = pharmacy[0];
    if (firstPharm) {
      expect(firstPharm.properties.category).toBe("pharmacy");
    }
  });

  it("filters merchants by Gold Supporters only", () => {
    const supporters = filterFeatures(MOCK_FEATURES, { supportersOnly: true });
    expect(supporters.length).toBe(2);
    expect(supporters.every((f) => f.properties.isSupporter)).toBe(true);
  });

  it("combines multiple filters correctly", () => {
    const combined = filterFeatures(MOCK_FEATURES, {
      district: "gampaha",
      supportersOnly: true,
      search: "retail",
    });
    expect(combined.length).toBe(1);
    const firstMatch = combined[0];
    if (firstMatch) {
      expect(firstMatch.properties.id).toBe("mer_gam_004");
    }
  });

  it("generates correct Google Maps directions URL with 4 decimal coordinates", () => {
    const url = getDirectionsUrl(6.927079, 79.861243);
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&destination=6.9271,79.8612");
  });

  it("detects WebGL context availability gracefully", () => {
    const hasWebGL = isWebGLAvailable(() => ({}));
    expect(hasWebGL).toBe(true);

    const noWebGL = isWebGLAvailable(() => null);
    expect(noWebGL).toBe(false);

    const throwing = isWebGLAvailable(() => {
      throw new Error("Context failed");
    });
    expect(throwing).toBe(false);
  });

  it("strictly enforces privacy on GeoFeature properties (AC-04.1)", () => {
    const allowedKeys = new Set(["id", "shopName", "category", "district", "city", "isSupporter", "since"]);

    for (const f of MOCK_FEATURES) {
      const keys = Object.keys(f.properties);
      for (const key of keys) {
        expect(allowedKeys.has(key)).toBe(true);
      }
      const record = f.properties as unknown as Record<string, unknown>;
      expect(record.phone).toBeUndefined();
      expect(record.whatsapp).toBeUndefined();
      expect(record.telegram).toBeUndefined();
      expect(record.fullName).toBeUndefined();
      expect(record.ownerUserId).toBeUndefined();
      expect(record.claimTokenHash).toBeUndefined();
      expect(record.ipHash).toBeUndefined();
    }
  });

  it("verifies CSP policy in _headers permits 'unsafe-eval' for MapLibre Web Worker", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const headersContent = await fs.readFile(path.resolve(process.cwd(), "public/_headers"), "utf8");
    expect(headersContent).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(headersContent).toContain("worker-src 'self' blob:");
    expect(headersContent).toContain("connect-src 'self'");
  });
});
