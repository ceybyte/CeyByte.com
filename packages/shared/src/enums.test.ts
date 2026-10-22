import { describe, expect, test } from "bun:test";
import { DISTRICTS, PROVINCES, SRI_LANKA_BOUNDS } from "./enums";

describe("Sri Lanka geography", () => {
  test("has exactly 25 unique districts", () => {
    expect(DISTRICTS).toHaveLength(25);
    expect(new Set(DISTRICTS).size).toBe(25);
  });

  test("every district belongs to exactly one of the 9 provinces", () => {
    const fromProvinces = Object.values(PROVINCES).flat();
    expect(Object.keys(PROVINCES)).toHaveLength(9);
    expect(fromProvinces.toSorted()).toEqual([...DISTRICTS].toSorted());
  });

  test("bounds cover the island", () => {
    expect(SRI_LANKA_BOUNDS.minLat).toBeLessThan(SRI_LANKA_BOUNDS.maxLat);
    expect(SRI_LANKA_BOUNDS.minLng).toBeLessThan(SRI_LANKA_BOUNDS.maxLng);
  });
});
