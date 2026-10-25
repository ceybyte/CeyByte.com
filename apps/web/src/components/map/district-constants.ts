export interface DistrictInfo {
  id: string;
  code: string;
  lat: number;
  lng: number;
}

/**
 * All 25 administrative districts of Sri Lanka with official centroids and 3-letter codes.
 * Order maps to 5x5 DistrictGrid (FR-04.7, Screen Blueprint S03).
 */
export const SRI_LANKA_DISTRICTS: DistrictInfo[] = [
  // Row 1: North & North-Central
  { id: "jaffna", code: "JAF", lat: 9.66, lng: 80.02 },
  { id: "kilinochchi", code: "KIL", lat: 9.38, lng: 80.4 },
  { id: "mannar", code: "MAN", lat: 8.98, lng: 79.9 },
  { id: "mullaitivu", code: "MUL", lat: 9.26, lng: 80.81 },
  { id: "vavuniya", code: "VAV", lat: 8.75, lng: 80.5 },

  // Row 2: North Central & North Western
  { id: "anuradhapura", code: "ANU", lat: 8.31, lng: 80.4 },
  { id: "polonnaruwa", code: "POL", lat: 7.94, lng: 81.0 },
  { id: "puttalam", code: "PUT", lat: 8.03, lng: 79.82 },
  { id: "kurunegala", code: "KUR", lat: 7.48, lng: 80.36 },
  { id: "matale", code: "MTL", lat: 7.47, lng: 80.62 },

  // Row 3: Central & Eastern
  { id: "kandy", code: "KAN", lat: 7.2906, lng: 80.6337 },
  { id: "nuwara-eliya", code: "NUW", lat: 6.97, lng: 80.78 },
  { id: "trincomalee", code: "TRI", lat: 8.58, lng: 81.23 },
  { id: "batticaloa", code: "BAT", lat: 7.71, lng: 81.7 },
  { id: "ampara", code: "AMP", lat: 7.28, lng: 81.67 },

  // Row 4: Western & Sabaragamuwa
  { id: "gampaha", code: "GAM", lat: 7.09, lng: 79.99 },
  { id: "colombo", code: "COL", lat: 6.9271, lng: 79.8612 },
  { id: "kalutara", code: "KAL", lat: 6.58, lng: 79.96 },
  { id: "kegalle", code: "KEG", lat: 7.25, lng: 80.34 },
  { id: "ratnapura", code: "RAT", lat: 6.68, lng: 80.4 },

  // Row 5: Uva & Southern
  { id: "badulla", code: "BAD", lat: 6.99, lng: 81.05 },
  { id: "monaragala", code: "MON", lat: 6.87, lng: 81.35 },
  { id: "hambantota", code: "HAM", lat: 6.12, lng: 81.12 },
  { id: "matara", code: "MTR", lat: 5.95, lng: 80.53 },
  { id: "galle", code: "GAL", lat: 6.0535, lng: 80.221 },
];

export const DISTRICT_MAP = new Map<string, DistrictInfo>(
  SRI_LANKA_DISTRICTS.map((d) => [d.id, d]),
);
