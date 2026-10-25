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
  background: "#18181B",
  earth: "#18181B",
  water: "#141414",
  sand: "#1c1c1f",
  glacier: "#18181B",
  buildings: "#1e1e22",
  minor_service: "#242428",
  minor_a: "#2E2E32",
  minor_b: "#27272A",
  link: "#2E2E32",
  major: "#2E2E32",
  highway: "#3F3F46",
  railway: "#141414",
  boundaries: "#3A3A40",
  tunnel_other: "#1e1e22",
  tunnel_minor: "#1e1e22",
  tunnel_major: "#1e1e22",
  tunnel_highway: "#1e1e22",
  bridges_other: "#27272A",
  bridges_minor: "#27272A",
  bridges_major: "#2E2E32",
  bridges_highway: "#3F3F46",
  roads_label_minor: "#52525B",
  roads_label_minor_halo: "#18181B",
  roads_label_major: "#71717A",
  roads_label_major_halo: "#18181B",
  city_label: "#71717A",
  city_label_halo: "#18181B",
  subplace_label: "#52525B",
  subplace_label_halo: "#18181B",
  state_label: "#52525B",
  state_label_halo: "#18181B",
  country_label: "#71717A",
  ocean_label: "#52525B",
};

export const CBPOS_LIGHT_FLAVOR: Flavor = {
  ...namedFlavor("light"),
  background: "#FAFAFA",
  earth: "#FAFAFA",
  water: "#E4E4E7",
  sand: "#F4F4F5",
  glacier: "#FAFAFA",
  buildings: "#F4F4F5",
  minor_service: "#F4F4F5",
  minor_a: "#E4E4E7",
  minor_b: "#E4E4E7",
  link: "#E4E4E7",
  major: "#E4E4E7",
  highway: "#D4D4D8",
  railway: "#E4E4E7",
  boundaries: "#D4D4D8",
  tunnel_other: "#F4F4F5",
  tunnel_minor: "#F4F4F5",
  tunnel_major: "#E4E4E7",
  tunnel_highway: "#D4D4D8",
  bridges_other: "#F4F4F5",
  bridges_minor: "#E4E4E7",
  bridges_major: "#E4E4E7",
  bridges_highway: "#D4D4D8",
  roads_label_minor: "#A1A1AA",
  roads_label_minor_halo: "#FFFFFF",
  roads_label_major: "#71717A",
  roads_label_major_halo: "#FFFFFF",
  city_label: "#71717A",
  city_label_halo: "#FFFFFF",
  subplace_label: "#A1A1AA",
  subplace_label_halo: "#FFFFFF",
  state_label: "#A1A1AA",
  state_label_halo: "#FFFFFF",
  country_label: "#71717A",
  ocean_label: "#A1A1AA",
};

export const DEFAULT_PMTILES_URL =
  process.env.NEXT_PUBLIC_TILES_URL || "https://build.protomaps.com/20261024.pmtiles";

/**
 * Builds a MapLibre StyleSpecification tailored with our tokens and English Latin-script labels.
 */
export function buildBasemapStyle(
  theme: "dark" | "light" = "dark",
  tileUrl: string = DEFAULT_PMTILES_URL,
): StyleSpecification {
  const flavor = theme === "light" ? CBPOS_LIGHT_FLAVOR : CBPOS_DARK_FLAVOR;

  return {
    version: 8,
    glyphs: "/fonts/{fontstack}/{range}.pbf",
    sprite: `/sprites/v4/${theme}`,
    sources: {
      protomaps: {
        type: "vector",
        url: tileUrl.startsWith("pmtiles://") ? tileUrl : `pmtiles://${tileUrl}`,
        attribution: "© OpenStreetMap contributors · Protomaps",
      },
    },
    // ADR-0008: Map labels strictly use Latin-script names in all locales
    layers: layers("protomaps", flavor, { lang: "en" }),
  };
}
