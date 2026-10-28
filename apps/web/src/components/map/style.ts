/* eslint-disable no-restricted-syntax */
import { layers, namedFlavor, type Flavor } from "@protomaps/basemaps";
import type { StyleSpecification } from "maplibre-gl";

/**
 * Token-recoloured Protomaps flavours per docs/03-DESIGN.md §8.9 & docs/01-PRD.md §FR-04.1.
 *
 * Dark:
 * - Land: --canvas (#18181B)
 * - Water: #141414
 * - Roads: --hairline (#2E2E32)
 * - Boundaries: --hairline-grid (#3A3A40)
 * - Labels: --text-muted (#71717A) with #18181B halo
 *
 * Light:
 * - Land: --canvas (#FAFAFA)
 * - Water: #E4E4E7
 * - Roads: --hairline (#E4E4E7)
 * - Boundaries: #D4D4D8
 * - Labels: --text-muted (#71717A) with #FFFFFF halo
 */

export const CBPOS_DARK_FLAVOR: Flavor = {
  ...namedFlavor("dark"),
  background: "#08090C", // deep midnight ocean
  earth: "#1E222A", // prominent slate Sri Lanka landmass
  water: "#08090C", // inland lakes and water bodies
  sand: "#262C38", // coastal sand
  glacier: "#1E222A",
  buildings: "#262C38",
  minor_service: "#282E3B",
  minor_a: "#303746",
  minor_b: "#2A313E",
  link: "#343C4D",
  major: "#4E5970", // crisp, clear major roads
  highway: "#6B7B9B", // distinct highways
  railway: "#1C1F26",
  boundaries: "#0393DD", // vibrant electric azure district borders
  tunnel_other: "#262C38",
  tunnel_minor: "#262C38",
  tunnel_major: "#343C4D",
  tunnel_highway: "#4E5970",
  bridges_other: "#2A313E",
  bridges_minor: "#2A313E",
  bridges_major: "#4E5970",
  bridges_highway: "#6B7B9B",
  roads_label_minor: "#94A3B8",
  roads_label_minor_halo: "#11141A",
  roads_label_major: "#CBD5E1",
  roads_label_major_halo: "#11141A",
  city_label: "#FFFFFF", // brilliant white text
  city_label_halo: "#0D0E12",
  subplace_label: "#E2E8F0",
  subplace_label_halo: "#0D0E12",
  state_label: "#CBD5E1",
  state_label_halo: "#0D0E12",
  country_label: "#FFFFFF",
  ocean_label: "#475569",
};

export const CBPOS_LIGHT_FLAVOR: Flavor = {
  ...namedFlavor("light"),
  background: "#C5D2E0", // deeper elegant water ocean
  earth: "#FFFFFF", // brilliant white Sri Lanka landmass
  water: "#B0C2D4", // inland lakes & rivers
  sand: "#EAEFF5",
  glacier: "#FFFFFF",
  buildings: "#EAEFF5",
  minor_service: "#E2E8F0",
  minor_a: "#CBD5E1",
  minor_b: "#CBD5E1",
  link: "#94A3B8",
  major: "#94A3B8",
  highway: "#64748B",
  railway: "#CBD5E1",
  boundaries: "#0393DD",
  tunnel_other: "#E2E8F0",
  tunnel_minor: "#E2E8F0",
  tunnel_major: "#94A3B8",
  tunnel_highway: "#64748B",
  bridges_other: "#CBD5E1",
  bridges_minor: "#CBD5E1",
  bridges_major: "#94A3B8",
  bridges_highway: "#64748B",
  roads_label_minor: "#64748B",
  roads_label_minor_halo: "#FFFFFF",
  roads_label_major: "#334155",
  roads_label_major_halo: "#FFFFFF",
  city_label: "#0F172A",
  city_label_halo: "#FFFFFF",
  subplace_label: "#334155",
  subplace_label_halo: "#FFFFFF",
  state_label: "#334155",
  state_label_halo: "#FFFFFF",
  country_label: "#0F172A",
  ocean_label: "#475569",
};

export const DEFAULT_PMTILES_URL =
  process.env.NEXT_PUBLIC_TILES_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "https://ceybyte.com/api/tiles/sri-lanka.pmtiles"
    : "/api/tiles/sri-lanka.pmtiles");

/**
 * Builds a MapLibre StyleSpecification tailored with our tokens and English Latin-script labels.
 */
export function buildBasemapStyle(
  theme: "dark" | "light" = "dark",
  tileUrl: string = DEFAULT_PMTILES_URL,
): StyleSpecification {
  const flavor = theme === "light" ? CBPOS_LIGHT_FLAVOR : CBPOS_DARK_FLAVOR;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullTileUrl = tileUrl.startsWith("http")
    ? tileUrl
    : `${origin}${tileUrl.startsWith("/") ? "" : "/"}${tileUrl}`;

  return {
    version: 8,
    glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${origin}/sprites/v4/${theme}`,
    sources: {
      protomaps: {
        type: "vector",
        url: fullTileUrl.startsWith("pmtiles://") ? fullTileUrl : `pmtiles://${fullTileUrl}`,
        attribution: "© OpenStreetMap contributors · Protomaps",
      },
    },
    // ADR-0008: Map labels strictly use Latin-script names in all locales
    layers: layers("protomaps", flavor, { lang: "en" }),
  };
}
