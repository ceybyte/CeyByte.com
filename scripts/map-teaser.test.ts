import { describe, expect, it } from "bun:test";
import { generateMapTeaserPng, generateMapTeaserSvg } from "./map-teaser";

describe("map-teaser generator", () => {
  it("generates SVG containing all 25 district nodes and coordinates", () => {
    const mockDistricts = [
      {
        id: "colombo",
        name: { en: "Colombo", si: "කොළඹ", ta: "கொழும்பு" },
        centroid: [6.9271, 79.8612] as [number, number],
        bbox: [79.8, 6.8, 80.0, 7.0] as [number, number, number, number],
      },
      {
        id: "kandy",
        name: { en: "Kandy", si: "මහනුවර", ta: "கண்டி" },
        centroid: [7.2906, 80.6337] as [number, number],
        bbox: [80.5, 7.1, 80.8, 7.4] as [number, number, number, number],
      },
    ];

    const svg = generateMapTeaserSvg(mockDistricts);
    expect(svg).toContain("<svg");
    expect(svg).toContain("LIVE TELEMETRY · 25 DISTRICTS");
    expect(svg).toContain("<!-- Colombo -->");
    expect(svg).toContain("<!-- Kandy -->");
  });

  it("renders map-teaser.png with valid PNG signature and proper dimensions", () => {
    const png = generateMapTeaserPng();
    expect(png.length).toBeGreaterThan(5000);

    // PNG signature: 0x89 'P' 'N' 'G' 0x0D 0x0A 0x1A 0x0A
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50); // P
    expect(png[2]).toBe(0x4e); // N
    expect(png[3]).toBe(0x47); // G
  });
});
