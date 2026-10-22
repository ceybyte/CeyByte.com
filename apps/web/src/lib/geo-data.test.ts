/// <reference types="bun-types" />
import { describe, expect, it } from "bun:test";
import { DISTRICTS } from "@cbpos/shared/enums";
import { isInSriLanka } from "@cbpos/shared/sri-lanka";
import cityFile from "../../public/data/lk-cities.json";
import districtFile from "../../public/data/lk-districts.json";

// Guards the OSM-derived files written by scripts/geo-data.ts (07 plan, Phase 2).
describe("lk-districts.json", () => {
  it("has the 25 districts in enum order, each named in all three languages", () => {
    expect(districtFile.districts.map((d) => d.id)).toEqual([...DISTRICTS]);
    for (const d of districtFile.districts) {
      expect(d.name.en && d.name.si && d.name.ta).toBeTruthy();
      const [lat = 0, lng = 0] = d.centroid;
      expect(isInSriLanka({ lat, lng })).toBe(true);
    }
  });

  it("credits OpenStreetMap", () => {
    expect(districtFile.attribution).toContain("OpenStreetMap");
    expect(cityFile.attribution).toContain("ODbL");
  });
});

describe("lk-cities.json", () => {
  const boxes = new Map(districtFile.districts.map((d) => [d.id, d.bbox]));

  it("has at least 300 towns covering every district", () => {
    expect(cityFile.cities.length).toBeGreaterThanOrEqual(300);
    expect(new Set(cityFile.cities.map((c) => c.district)).size).toBe(25);
  });

  it("places every town inside Sri Lanka and its district's bounding box", () => {
    for (const c of cityFile.cities) {
      expect(isInSriLanka(c)).toBe(true);
      const [minLng = 0, minLat = 0, maxLng = 0, maxLat = 0] = boxes.get(c.district) ?? [];
      expect(c.lng >= minLng && c.lng <= maxLng && c.lat >= minLat && c.lat <= maxLat).toBe(true);
    }
  });
});
